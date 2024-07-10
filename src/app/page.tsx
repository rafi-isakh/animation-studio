import WebnovelsWrapper from '@/components/Webnovels'
import GenresComponent from '@/components/GenresComponent';
import CarouselComponentReactSlick from '@/components/CarouselComponentReactSlick';

export default function Home() {
  return (
    <div>
      <CarouselComponentReactSlick />
      <GenresComponent/>
      <WebnovelsWrapper />
    </div>
  );
}
