import React from 'react'

import { useRegisterSW } from 'virtual:pwa-register/react'
import { Button } from './button'
import { Icons } from './icons'

function UpdatePrompt() {
    const {
        needRefresh: [needRefresh, setNeedRefresh],
        updateServiceWorker,
    } = useRegisterSW({
        onRegistered(r) {
            console.log('SW Registered: ' + r)
        },
        onRegisterError(error) {
            console.log('SW registration error', error)
        },
    })

    const close = () => {
        setNeedRefresh(false)
    }

    return (
        <div>
            {(needRefresh)
                && <div className="border-b border-gray-200 p-4 horizontal center-v gap-2 bg-gray-50">
                    <div className="horizontal gap-2 center-v text-sm">
                        <Icons.Info className="size-4" />
                        <span>New content available, click on reload button to update.</span>
                    </div>
                    <Button size="sm" className="ml-auto" onClick={() => updateServiceWorker(true)}>
                        <Icons.RefreshCcw className="size-4" />
                        Reload
                    </Button>
                    <Button variant="outline" color="secondary" size="sm" onClick={() => close()}>Close</Button>
                </div>
            }
        </div>
    )
}

export default UpdatePrompt