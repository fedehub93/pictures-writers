import { HeroSection } from "./_components/hero-section";
import { ReviewsView } from "./_components/reviews-view";
import { ServicesCta } from "./_components/services-cta";
import { CreativeFeatures } from "./_components/services";
import { LatestNews } from "./_components/latest-news";
import { ContactUs } from "./_components/contact-us";

const HomePage = () => {
  return (
    <>
      <HeroSection />
      <ReviewsView />
      <ServicesCta />
      <CreativeFeatures />
      <LatestNews />
      <ContactUs />
    </>
  );
};

export default HomePage;
