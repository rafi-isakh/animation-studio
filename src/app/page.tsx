import WebnovelsList from '@/components/WebnovelsList'
import GenresComponent from '@/components/GenresComponent';
import CarouselComponentReactSlick from '@/components/CarouselComponentReactSlick';

async function getCarouselItems() {
  const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND}/api/get_carousel_items`, {cache: 'no-store'
  })
  const data = await response.json()
  return data;
}

export default async function Home({ searchParams }: { searchParams: { [key: string]: string | string[] | undefined } }) {
  const items = await getCarouselItems();

  return (
    <div>
      <CarouselComponentReactSlick items={items}/>
      <GenresComponent/>
      <WebnovelsList searchParams={searchParams} sortBy='views'/>
      <WebnovelsList searchParams={searchParams} sortBy='date'/>
    </div>
  );
}
