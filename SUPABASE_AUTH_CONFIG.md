# Supabase Authentication Configuration

## Authentication Method: Email + Password

The app now uses **email/password authentication** instead of magic links:
- Users sign up once with email + password
- They verify their email (one-time)
- Then they can log in anytime with their password (no email required)

## Step 1: Enable Email/Password Authentication

Go to your **Supabase Dashboard**:

1. Navigate to **Authentication** → **Providers**
2. Ensure **Email** is enabled (it should be by default)
3. **Enable email confirmations**:
   - Toggle "Enable email confirmations" ON
   - This sends a verification email when users sign up

## Step 2: Add Redirect URLs

1. Navigate to **Authentication** → **URL Configuration**
2. Add these URLs to **Redirect URLs**:
   ```
   https://project-hubs.com
   https://project-hubs.com/
   http://localhost:5173
   http://localhost:5173/
   ```

## Step 3: Configure Site URL

1. Set **Site URL** to: `https://project-hubs.com`
2. This is the default redirect if none is specified

## Step 4: Email Templates (Optional)

If magic link emails still show localhost:

1. Go to **Authentication** → **Email Templates**
2. Edit the **Magic Link** template
3. Replace `{{ .SiteURL }}` with your production URL if needed

## Testing

After configuration:
1. Deploy your updated code to production
2. Have your friend **sign up** with email + password
3. They receive a verification email and click the link
4. Account is activated - they can now **log in** anytime with their password
5. No more emails required for subsequent logins!

## User Flow

### New User (Sign Up):
1. Click "Sign up" → Enter email + password
2. Receive verification email → Click link
3. Account activated → Can now log in

### Returning User (Login):
1. Enter email + password
2. Click "Sign In"
3. Instantly logged in (no email required!)

## Troubleshooting

If users can't log in:
- **Wrong password**: Supabase will show "Invalid login credentials"
- **Email not verified**: User must click the verification link in their email first
- **Check console**: Open browser console (F12) for error details
- **Supabase logs**: Go to **Authentication** → **Logs** to see auth attempts
- **RLS policies**: Verify policies in `supabase-schema.sql` allow user access
