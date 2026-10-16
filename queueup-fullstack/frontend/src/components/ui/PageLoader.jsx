import Spinner from "./Spinner";

export default function PageLoader() {
  return (
    <div className="grid min-h-[60dvh] place-items-center text-brand-600" role="status">
      <Spinner className="size-8" />
      <span className="sr-only">Loading</span>
    </div>
  );
}
