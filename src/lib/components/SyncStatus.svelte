<script>
    import { syncStatus, lastSyncTime } from '$lib/stores/tasks';
    import { user } from '$lib/stores/auth';
    import { Check, RefreshCw, AlertTriangle, WifiOff } from 'lucide-svelte';
    import { onMount } from 'svelte';

    let timeAgo = '';
    let showDetails = false;

    // Format time ago
    function formatTimeAgo(timestamp) {
        if (!timestamp) return '';

        const seconds = Math.floor((Date.now() - timestamp) / 1000);

        if (seconds < 60) return 'just now';
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
        return `${Math.floor(seconds / 86400)}d ago`;
    }

    // Update time ago every 30 seconds
    onMount(() => {
        const interval = setInterval(() => {
            if ($lastSyncTime) {
                timeAgo = formatTimeAgo($lastSyncTime);
            }
        }, 30000);

        return () => clearInterval(interval);
    });

    $: if ($lastSyncTime) {
        timeAgo = formatTimeAgo($lastSyncTime);
    }

    $: statusConfig = {
        idle: {
            icon: Check,
            color: '#4caf50',
            text: 'Synced',
            spin: false
        },
        syncing: {
            icon: RefreshCw,
            color: '#2196f3',
            text: 'Syncing...',
            spin: true
        },
        error: {
            icon: AlertTriangle,
            color: '#f44336',
            text: 'Sync failed',
            spin: false
        },
        offline: {
            icon: WifiOff,
            color: '#9e9e9e',
            text: 'Offline',
            spin: false
        }
    };

    $: currentStatus = statusConfig[$syncStatus] || statusConfig.idle;
</script>

{#if $user}
    <div
        class="sync-status"
        class:clickable={$syncStatus === 'error'}
        on:click={() => $syncStatus === 'error' && (showDetails = !showDetails)}
    >
        <svelte:component
            this={currentStatus.icon}
            size={14}
            class={currentStatus.spin ? 'spin' : ''}
            style="color: {currentStatus.color}"
        />
        <span class="status-text" style="color: {currentStatus.color}">
            {currentStatus.text}
        </span>
        {#if $syncStatus === 'idle' && timeAgo}
            <span class="time-ago">{timeAgo}</span>
        {/if}
    </div>
{/if}

<style>
    .sync-status {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 6px 12px;
        background: rgba(255, 255, 255, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 20px;
        font-size: 0.85rem;
        backdrop-filter: blur(10px);
    }

    .sync-status.clickable {
        cursor: pointer;
    }

    .sync-status.clickable:hover {
        background: rgba(255, 255, 255, 0.15);
    }

    .status-text {
        font-weight: 600;
    }

    .time-ago {
        color: rgba(255, 255, 255, 0.6);
        font-size: 0.8rem;
    }

    :global(.sync-status .spin) {
        animation: spin 2.5s linear infinite;
    }

    @keyframes spin {
        from {
            transform: rotate(0deg);
        }
        to {
            transform: rotate(360deg);
        }
    }
</style>
