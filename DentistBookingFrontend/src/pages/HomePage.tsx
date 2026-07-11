import { useEffect, useState } from "react";
import { getContactInfo } from "../services/APIService";

function Home() {
  const [websiteTitle, setWebsiteTitle] = useState("Smilecare");

  useEffect(() => {
    const loadWebsiteTitle = async () => {
      try {
        const data = await getContactInfo(1);
        setWebsiteTitle(data?.website_Title || data?.Website_Title || "Smilecare");
      } catch (error) {
        console.error("Failed to load website title", error);
      }
    };

    loadWebsiteTitle();
  }, []);

  return (
    <div className="home-page">
      <section className="hero-card">
        <div>
          <p className="eyebrow">Welcome to {websiteTitle}</p>
          <h1>Professional dental care made easy</h1>
          <p className="hero-copy">
            Book your appointment, view available doctors, and reach us quickly from a modern, comfortable experience.
          </p>
        </div>
      </section>

      <section className="feature-grid">
        <article className="feature-card">
          <h3>Choose your procedure</h3>
          <p>See all available treatments and request the service that fits your dental needs.</p>
        </article>
        <article className="feature-card">
          <h3>Pick the right doctor</h3>
          <p>Browse doctors by specialty and find the best match for your appointment.</p>
        </article>
        <article className="feature-card">
          <h3>Fast appointment booking</h3>
          <p>Submit your request in one easy form and receive confirmation quickly.</p>
        </article>
      </section>
    </div>
  );
}

export default Home;