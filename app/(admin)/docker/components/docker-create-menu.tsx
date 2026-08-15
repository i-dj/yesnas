import { Boxes, Download, Plus } from 'lucide-react'

import { ActionMenu, Button } from '@/components/ui'

export function DockerCreateMenu({ onPullClick }:{onPullClick: () => void}) {
    return (
        <>
      <Button variant="secondary" icon={Download} onClick={onPullClick}>
        拉取镜像
      </Button>
    <ActionMenu
      mode="left-click"
      align="end"
      onAction={(action) => console.info('create container action', action)}
      items={[
        { label: '快速创建', action: 'quick-create', icon: Plus },
        { label: 'Compose 部署', action: 'compose-deploy', icon: Boxes },
      ]}
      trigger={<Button icon={Plus}>创建容器</Button>}
    /></>
  )
}
