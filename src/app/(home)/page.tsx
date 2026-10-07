import { HeroSection } from "./_components/hero-section";
import { HomeReviewsView } from "@/modules/reviews";
import { ServicesCta } from "./_components/services-cta";
import { CreativeFeatures } from "./_components/services";
import { LatestNews } from "./_components/latest-news";
import { ContactUs } from "./_components/contact-us";

const HomePage = () => {
  return (
    <>
      <HeroSection />
      <HomeReviewsView />
      <ServicesCta />
      <CreativeFeatures />
      <LatestNews />
      <ContactUs />
    </>
  );
};

export default HomePage;
