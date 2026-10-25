import { Modal, message } from 'antd'
import type { OccupantRow } from '../api/dorms'

export async function confirmDormDelete(options: {
  title: string
  loadOccupants: () => Promise<OccupantRow[]>
  onDelete: () => Promise<void>
  onDone?: () => void
}) {
  const occupants = await options.loadOccupants()
  if (occupants.length) {
    Modal.error({
      title: `无法删除${options.title}`,
      width: 520,
      content: (
        <div>
          <p>以下学员仍占用床位，请先退宿或换床后再删：</p>
          <ul style={{ paddingLeft: 18, marginBottom: 0, maxHeight: 240, overflow: 'auto' }}>
            {occupants.map((item) => (
              <li key={`${item.bedId}-${item.studentId}`}>
                {item.studentName}
                {item.studentPhone ? `（${item.studentPhone}）` : ''} · {item.bedLabel}
              </li>
            ))}
          </ul>
        </div>
      ),
    })
    return
  }
  Modal.confirm({
    title: `确认删除${options.title}？`,
    content: '删除后其下空床位/空房间等结构会一并清除，此操作不可恢复。',
    okText: '确认删除',
    okButtonProps: { danger: true },
    cancelText: '取消',
    onOk: async () => {
      await options.onDelete()
      message.success('已删除')
      options.onDone?.()
    },
  })
}
