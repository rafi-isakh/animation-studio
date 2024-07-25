import PopularWebnovels from '@/components/PopularWebnovels'
import GenresComponent from '@/components/GenresComponent';
import CarouselComponentReactSlick from '@/components/CarouselComponentReactSlick';
import Link from 'next/link';

async function getCarouselItems() {
  const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND}/api/get_carousel_items`)
  const data = await response.json()
  return data;
}

export default async function Home({ searchParams }: { searchParams: { [key: string]: string | string[] | undefined } }) {
  const items = await getCarouselItems();

  return (
    <div>
      <CarouselComponentReactSlick items={items}/>
      <GenresComponent/>
      <PopularWebnovels searchParams={searchParams}/>
    </div>
  );
}
