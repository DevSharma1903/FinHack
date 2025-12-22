export type FeedDefinition = {
  id: string;
  title: string;
  url: string;
  tags?: string[];
};

export type FeedItem = {
  id: string;
  feedId: string;
  feedTitle: string;
  title: string;
  link?: string;
  publishedAt?: string;
  summary?: string;
};
