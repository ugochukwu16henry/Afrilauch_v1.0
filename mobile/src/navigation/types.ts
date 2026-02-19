export type MainTabParamList = {
  Projects: undefined;
  Tasks: undefined;
  Agreements: undefined;
  Notifications: undefined;
  Chat: undefined;
  AI: undefined;
  Account: undefined;
};

export type RootStackParamList = {
  Login: undefined;
  Main: undefined;
  ProjectDetail: { projectId: string };
  AgreementSign: { agreementId: string; title: string };
  ChatThread: { projectId: string; projectName: string };
};