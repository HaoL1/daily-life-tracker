export interface NoticeAction {
  label: string
  run: () => void | Promise<void>
}

export type Notify = (message: string, action?: NoticeAction) => void
