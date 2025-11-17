export type OtieUserState = {
  anxietyLevel: number;
  lastMessage?: string;
  messageCount: number;
  sessionStart: number;
};

let state: OtieUserState = {
  anxietyLevel: 0,
  lastMessage: "",
  messageCount: 0,
  sessionStart: Date.now(),
};

export function getUserState() {
  return { ...state };
}

export function updateUserState(newMessage: string, anxiety: number) {
  state = {
    ...state,
    lastMessage: newMessage,
    anxietyLevel: anxiety,
    messageCount: state.messageCount + 1,
  };
}
