export type Reply = {
  id: string;
  authorId: string;
  authorName: string;
  message: string;
  createdAt: number;
};

export type CommentThread = {
  id: string;
  roomId: string;
  authorId: string;
  authorName: string;
  lineNumber: number;
  message: string;
  replies: Reply[];
  createdAt: number;
};
