import Webnovels from '@/components/Webnovels'
import GenresComponent from '@/components/GenresComponent';
import CarouselComponentReactSlick from '@/components/CarouselComponentReactSlick';

export default function Home({ searchParams }: { searchParams: { [key: string]: string | string[] | undefined } }) {
  return (
    <div>
      <CarouselComponentReactSlick />
      <GenresComponent/>
      <Webnovels searchParams={searchParams}/>
    </div>
  );
}
