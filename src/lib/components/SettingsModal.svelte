<script>
    import { createEventDispatcher } from 'svelte';
    import { fade, scale } from 'svelte/transition';
    import { X, User, LogOut, Loader2, Mail } from 'lucide-svelte';
    import { supabase } from '$lib/supabase'; 
    import { user } from '$lib/stores/auth'; 

    const dispatch = createEventDispatcher();
    
    let loading = false;
    let email = "";
    let sentMagicLink = false;

    // 1. HANDLE LOGIN (Magic Link)
    async function handleLogin() {
        if (!email) return alert("Please enter an email");
        loading = true;
        
        const { error } = await supabase.auth.signInWithOtp({ email });
        
        if (error) {
            alert(error.message);
        } else {
            sentMagicLink = true;
        }
        loading = false;
    }

    // 2. HANDLE LOGOUT
    async function handleSignOut() {
        loading = true;
        await supabase.auth.signOut();
        // We don't need to manually clear the store; auth.js listens for this!
        dispatch('close');
        loading = false;
    }
</script>

<div class="modal-backdrop" on:click|self={() => dispatch('close')} transition:fade={{ duration: 200 }}>
    <div class="modal-glass" transition:scale={{ start: 0.95, duration: 200 }}>
        
        <div class="modal-header">
            <h2>{$user ? 'Account' : 'Welcome'}</h2>
            <button class="close-btn" on:click={() => dispatch('close')}>
                <X size={24} />
            </button>
        </div>

        {#if $user}
            <div class="section profile-section">
                <div class="avatar">
                    {$user.email ? $user.email[0].toUpperCase() : 'U'}
                </div>
                <div class="user-info">
                    <h3>My Account</h3>
                    <span class="email">{$user.email}</span>
                    <span class="badge free">Free Plan</span> 
                </div>
            </div>

            <div class="divider"></div>

            <div class="section">
                <h3>Subscription</h3>
                <p class="sub-text">Upgrade to Pro to sync across unlimited devices and unlock advanced analytics.</p>
                <button class="btn-upgrade">Upgrade to Pro ($5/mo)</button>
            </div>

            <div class="modal-footer">
                <button class="btn-signout" on:click={handleSignOut} disabled={loading}>
                    {#if loading}<Loader2 size={16} class="spin"/>{:else}<LogOut size={16} />{/if}
                    Sign Out
                </button>
            </div>

        {:else}
            <div class="login-container">
                <div class="login-icon">
                    <User size={48} strokeWidth={1.5} />
                </div>
                <h3>Sign in to Sync</h3>
                <p>Save your tasks and stats across all your devices.</p>

                {#if sentMagicLink}
                    <div class="magic-sent">
                        <Mail size={32} />
                        <p>Check your email! We sent you a magic link to log in.</p>
                    </div>
                {:else}
                    <div class="input-group">
                        <input type="email" placeholder="name@example.com" bind:value={email} />
                    </div>
                    
                    <button class="btn-primary" on:click={handleLogin} disabled={loading}>
                        {#if loading}
                            <Loader2 size={18} class="spin"/>
                        {:else}
                            Send Magic Link
                        {/if}
                    </button>
                {/if}
            </div>
        {/if}
    </div>
</div>

<style>
    /* UTILITIES */
    .spin { animation: spin 1s linear infinite; }
    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

    /* LAYOUT & CONTAINERS */
    .modal-backdrop { position: fixed; inset: 0; z-index: 9999; background: rgba(0, 0, 0, 0.6); backdrop-filter: blur(8px); display: flex; justify-content: center; align-items: center; padding: 20px; }
    .modal-glass { width: 100%; max-width: 450px; background: rgba(30, 30, 30, 0.95); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 24px; padding: 30px; box-shadow: 0 40px 80px rgba(0,0,0,0.6); color: white; display: flex; flex-direction: column; gap: 20px; }
    
    .modal-header { display: flex; justify-content: space-between; align-items: center; }
    .modal-header h2 { margin: 0; font-size: 1.5rem; }
    .close-btn { background: transparent; border: none; color: rgba(255,255,255,0.4); cursor: pointer; padding: 5px; border-radius: 50%; transition: 0.2s; }
    .close-btn:hover { background: rgba(255,255,255,0.1); color: white; }

    /* PROFILE VIEW */
    .profile-section { display: flex; align-items: center; gap: 15px; }
    .avatar { width: 50px; height: 50px; background: #ba4949; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 1.2rem; color: white; }
    .user-info { display: flex; flex-direction: column; }
    .user-info h3 { margin: 0; font-size: 1rem; }
    .email { font-size: 0.8rem; color: rgba(255,255,255,0.5); }
    .badge { margin-top: 4px; padding: 2px 6px; border-radius: 4px; font-size: 0.7rem; width: fit-content; }
    .badge.free { background: rgba(255,255,255,0.1); color: rgba(255,255,255,0.7); }
    
    .divider { height: 1px; background: rgba(255,255,255,0.1); }
    .sub-text { font-size: 0.85rem; color: rgba(255,255,255,0.6); margin-bottom: 10px; margin-top: 0; }

    /* LOGIN VIEW */
    .login-container { display: flex; flex-direction: column; align-items: center; text-align: center; gap: 15px; padding: 20px 0; }
    .login-icon { width: 80px; height: 80px; background: rgba(255,255,255,0.05); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-bottom: 10px; }
    .login-container h3 { margin: 0; font-size: 1.4rem; }
    .login-container p { margin: 0; color: rgba(255,255,255,0.6); font-size: 0.9rem; }

    .input-group { width: 100%; }
    input { width: 100%; padding: 12px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.2); background: rgba(0,0,0,0.2); color: white; outline: none; box-sizing: border-box; font-family: inherit; }
    input:focus { border-color: #ba4949; background: rgba(0,0,0,0.4); }

    /* BUTTONS */
    .btn-primary { width: 100%; background: white; color: #ba4949; border: none; padding: 12px; border-radius: 10px; font-weight: 700; cursor: pointer; display: flex; justify-content: center; align-items: center; gap: 8px; transition: 0.2s; font-size: 1rem; }
    .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.2); }
    .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }

    .btn-upgrade { width: 100%; background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%); color: black; border: none; padding: 12px; border-radius: 10px; font-weight: 700; cursor: pointer; box-shadow: 0 4px 15px rgba(255, 215, 0, 0.1); transition: 0.2s; }
    .btn-upgrade:hover { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(255, 215, 0, 0.25); }

    .modal-footer { margin-top: auto; padding-top: 20px; border-top: 1px solid rgba(255,255,255,0.1); width: 100%; display: flex; justify-content: flex-start; }
    .btn-signout { background: transparent; border: none; color: #ff7675; cursor: pointer; display: flex; align-items: center; gap: 8px; font-size: 0.9rem; font-weight: 600; padding: 0; }
    .btn-signout:hover { text-decoration: underline; }

    .magic-sent { background: rgba(76, 175, 80, 0.1); color: #81c784; padding: 20px; border-radius: 12px; border: 1px solid rgba(76, 175, 80, 0.3); display: flex; flex-direction: column; align-items: center; gap: 10px; width: 100%; box-sizing: border-box; }
</style>