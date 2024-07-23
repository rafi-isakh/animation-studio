import Webnovels from '@/components/Webnovels'
import GenresComponent from '@/components/GenresComponent';
import CarouselComponentReactSlick from '@/components/CarouselComponentReactSlick';
import Link from 'next/link';

export default function Home({ searchParams }: { searchParams: { [key: string]: string | string[] | undefined } }) {
  return (
    <div>
      <CarouselComponentReactSlick />
      <GenresComponent/>
      <Webnovels searchParams={searchParams}/>
    </div>
  );
}
