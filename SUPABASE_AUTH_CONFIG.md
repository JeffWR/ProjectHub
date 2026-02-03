# Supabase Authentication Configuration

## Step 1: Add Redirect URLs

Go to your **Supabase Dashboard**:

1. Navigate to **Authentication** → **URL Configuration**
2. Add these URLs to **Redirect URLs**:
   ```
   https://project-hubs.com
   https://project-hubs.com/
   http://localhost:5173
   http://localhost:5173/
   ```

## Step 2: Configure Site URL

1. Set **Site URL** to: `https://project-hubs.com`
2. This is the default redirect if none is specified

## Step 3: Email Templates (Optional)

If magic link emails still show localhost:

1. Go to **Authentication** → **Email Templates**
2. Edit the **Magic Link** template
3. Replace `{{ .SiteURL }}` with your production URL if needed

## Testing

After configuration:
1. Deploy your updated code to production
2. Have your friend request a new magic link
3. They should be redirected to `https://project-hubs.com` and logged in automatically

## Troubleshooting

If users still can't log in:
- Check browser console for errors
- Verify the email link points to `project-hubs.com` (not localhost)
- Make sure RLS policies allow user access (check supabase-schema.sql)
- Check Supabase logs: **Authentication** → **Logs**
