import ContactUs from "./_components/contact-us";
import { HeroSection } from "./_components/hero-section";
import LatestNews from "./_components/latest-news";
import CreativeFeatures from "./_components/services";

const HomePage = () => {
  return (
    <>
      <HeroSection />
      <CreativeFeatures />
      <LatestNews />
      <ContactUs />
    </>
  );
};

export default HomePage;
