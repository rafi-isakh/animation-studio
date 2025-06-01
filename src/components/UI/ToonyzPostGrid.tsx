import { Pin } from "./Pin";
import Masonry from "react-masonry-css";
import { ToonyzPost, Language, Dictionary } from "@/components/Types";

interface ToonyzPostGridProps {
  posts: ToonyzPost[];
  language?: Language;
  dictionary?: Dictionary;
  breakpointCols?: {
    default: number;
    [key: number]: number;
  };
  renderItem?: (post: ToonyzPost, index: number) => JSX.Element;
  className?: string;
  containerClassName?: string;
}

const ToonyzPostGrid = ({
  posts,
  language,
  dictionary,
  breakpointCols = {
    default: 4,
    1100: 3,
    700: 2,
    500: 1
  },
  renderItem = (post: ToonyzPost) => <Pin key={post.id} post={post} language={language || 'ko' || 'en'} dictionary={dictionary || {}} />,
  className = "my-masonry-grid flex w-auto gap-5",
  containerClassName = "relative md:max-w-screen-xl mx-auto w-full min-h-screen"
}: ToonyzPostGridProps) => {
  return (
    <div className={containerClassName}>
      <main className="relative md:max-w-screen-xl w-full mx-auto">
        <Masonry
          breakpointCols={breakpointCols}
          className={className}
          columnClassName="my-masonry-grid_column bg-clip-padding"
        >
          {posts.map((post, index) => renderItem(post, index))}
        </Masonry>
      </main>
    </div>
  );
};

export default ToonyzPostGrid;