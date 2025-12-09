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
        const { code, userId, redirectUri } = await req.json()

        if (!code || !userId) {
            throw new Error('Missing required parameters')
        }

        const clientId = Deno.env.get('GOOGLE_CLIENT_ID')
        const clientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET')

        if (!clientId || !clientSecret) {
            throw new Error('Google OAuth credentials not configured')
        }

        // Exchange code for tokens
        const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                code,
                client_id: clientId,
                client_secret: clientSecret,
                redirect_uri: redirectUri,
                grant_type: 'authorization_code'
            })
        })

        if (!tokenResponse.ok) {
            const errorData = await tokenResponse.json()
            throw new Error(`Token exchange failed: ${errorData.error_description || errorData.error}`)
        }

        const tokens = await tokenResponse.json()
        const { access_token, refresh_token } = tokens

        if (!access_token) {
            throw new Error('No access token received')
        }

        // Create root folder in Drive
        const folderResponse = await fetch('https://www.googleapis.com/drive/v3/files', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${access_token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name: 'AI Photo Studio',
                mimeType: 'application/vnd.google-apps.folder'
            })
        })

        if (!folderResponse.ok) {
            console.error('Failed to create Drive folder:', await folderResponse.text())
        }

        const folder = folderResponse.ok ? await folderResponse.json() : null
        const folderId = folder?.id || null

        // Save tokens to database
        const supabase = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        const { error } = await supabase
            .from('users')
            .update({
                google_drive_token: access_token,
                google_drive_refresh_token: refresh_token,
                google_drive_folder_id: folderId,
                google_drive_connected_at: new Date().toISOString()
            })
            .eq('id', userId)

        if (error) {
            console.error('Database update error:', error)
            throw new Error('Failed to save connection')
        }

        return new Response(JSON.stringify({
            success: true,
            message: 'Google Drive connected successfully'
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        })

    } catch (error) {
        console.error('Google Drive connect error:', error)
        return new Response(JSON.stringify({
            error: error.message || 'Failed to connect Google Drive'
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        })
    }
})
