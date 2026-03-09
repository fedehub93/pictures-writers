import { HeroSection } from "./_components/hero-section";
import { ReviewsView } from "./_components/reviews-view";
import { CreativeFeatures } from "./_components/services";
import { LatestNews } from "./_components/latest-news";
import { ContactUs } from "./_components/contact-us";

const HomePage = () => {
  return (
    <>
      <HeroSection />
      <ReviewsView />
      <CreativeFeatures />
      <LatestNews />
      <ContactUs />
    </>
  );
};

export default HomePage;
