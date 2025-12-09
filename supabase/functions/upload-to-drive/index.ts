import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { userId, generationId, images } = await req.json()

        if (!userId || !generationId || !images || images.length === 0) {
            throw new Error('Missing required parameters')
        }

        const supabase = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        // Get user's Drive token
        const { data: user, error: userError } = await supabase
            .from('users')
            .select('google_drive_token, google_drive_refresh_token, google_drive_folder_id')
            .eq('id', userId)
            .single()

        if (userError || !user || !user.google_drive_token) {
            throw new Error('Google Drive not connected')
        }

        let accessToken = user.google_drive_token

        // Refresh token if needed
        if (user.google_drive_refresh_token) {
            try {
                const refreshResponse = await fetch('https://oauth2.googleapis.com/token', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        client_id: Deno.env.get('GOOGLE_CLIENT_ID'),
                        client_secret: Deno.env.get('GOOGLE_CLIENT_SECRET'),
                        refresh_token: user.google_drive_refresh_token,
                        grant_type: 'refresh_token'
                    })
                })

                if (refreshResponse.ok) {
                    const tokens = await refreshResponse.json()
                    accessToken = tokens.access_token

                    // Update token in database
                    await supabase
                        .from('users')
                        .update({ google_drive_token: accessToken })
                        .eq('id', userId)
                }
            } catch (e) {
                console.error('Token refresh failed:', e)
            }
        }

        // Create session folder in Drive
        const folderName = `Photo Session - ${new Date().toISOString().split('T')[0]}`
        const folderResponse = await fetch('https://www.googleapis.com/drive/v3/files', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name: folderName,
                mimeType: 'application/vnd.google-apps.folder',
                parents: user.google_drive_folder_id ? [user.google_drive_folder_id] : []
            })
        })

        if (!folderResponse.ok) {
            throw new Error('Failed to create folder in Drive')
        }

        const folder = await folderResponse.json()
        const folderId = folder.id

        // Upload each image
        const uploadedFiles = []
        for (let i = 0; i < images.length; i++) {
            const imageUrl = images[i]

            // Download image
            const imageResponse = await fetch(imageUrl)
            if (!imageResponse.ok) continue

            const imageBlob = await imageResponse.blob()
            const imageBuffer = await imageBlob.arrayBuffer()

            // Upload to Drive
            const metadata = {
                name: `photo_${i + 1}.jpg`,
                parents: [folderId]
            }

            const form = new FormData()
            form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }))
            form.append('file', new Blob([imageBuffer], { type: 'image/jpeg' }))

            const uploadResponse = await fetch(
                'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${accessToken}`
                    },
                    body: form
                }
            )

            if (uploadResponse.ok) {
                const file = await uploadResponse.json()
                uploadedFiles.push(file)
            }
        }

        // Get folder web link
        const folderUrl = `https://drive.google.com/drive/folders/${folderId}`

        // Update generation with Drive link
        await supabase
            .from('generations')
            .update({ google_drive_folder_url: folderUrl })
            .eq('id', generationId)

        return new Response(JSON.stringify({
            success: true,
            folderUrl,
            filesUploaded: uploadedFiles.length
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        })

    } catch (error) {
        console.error('Drive upload error:', error)
        return new Response(JSON.stringify({
            error: error.message || 'Failed to upload to Google Drive',
            success: false
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        })
    }
})
