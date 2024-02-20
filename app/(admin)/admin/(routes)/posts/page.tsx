import { ContentHeader } from "@/components/content/content-header";

const PostsPage = () => {
  return (
    <div className="h-full w-full flex p-3">
      <ContentHeader label="Posts" contentType="posts" />
    </div>
  );
};

export default PostsPage;
