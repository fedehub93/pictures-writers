import { CustomElement } from "../slate-renderer";

interface VideoElementProps {
  node: CustomElement;
}

export const VideoElement = ({ node }: VideoElementProps) => {
  return (
    <span className="relative mt-6 block w-full pb-[56.25%]">
      <iframe
        id="ytplayer"
        title={node.data.uri}
        src={node.data.uri}
        width="100%"
        height="600px"
        className="absolute left-0 top-0 h-full w-full"
        allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture ; fullscreen"
      />
    </span>
  );
};
