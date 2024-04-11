import Image from "next/image";

const AboutPage = () => (
  <>
    <section className="bg-indigo-100/40 px-4 pt-20 lg:px-6">
      <div className="mx-auto max-w-lg md:max-w-screen-md lg:max-w-6xl">
        <h1 className="mb-4 text-center text-3xl font-bold">Chi siamo</h1>
        <p className="mx-auto max-w-lg text-center text-gray-400">
          Siamo un team appassionato che si impegna a
          <span className="evidence">
            fornirti tutto ciò di cui hai bisogno per diventare uno
            sceneggiatore di successo.
          </span>
          e a nutrire la tua fiamma creativa.
        </p>
        <div className="grid grid-cols-1 items-center gap-x-16 md:grid-cols-2">
          <div className="md:order-1 aspect-square">
            <Image
              src="/chi-siamo.png"
              alt="Feature"
              width={2000}
              height={2000}
              className="h-auto w-full"
            />
          </div>

          <div className="md:order-2">
            <p className="uppercase text-heading">Mission</p>
            <h2 className="mt-4 text-2xl font-bold">
              Perfezionare il mestiere dello sceneggiatore.
            </h2>
            <p className="mt-2 text-gray-400">
              Pictures Writers nasce da una grande passione per le storie, ed in
              particolare per quelle raccontate attraverso il mezzo
              cinematografico.
              <br />
              <br />
              La nostra missione è semplice ma potente:{" "}
              <span className="evidence">
                alimentare la tua passione per la scrittura, offrendoti
                ispirazione, istruzione e una comunità di supporto dedicata.
              </span>
            </p>
          </div>
        </div>
      </div>
    </section>
    <section className="px-4 py-20 lg:px-6">
      <h2 className="mb-8 text-center text-3xl font-bold ">Fondatore</h2>
      <div className="flex flex-col items-center">
        <Image
          src="/federico-verrengia.jpg"
          alt="Foto profilo Federico Verrengia"
          width={640}
          height={640}
          className="mx-auto mb-4 block rounded-full border-2 border-neutral-200 grayscale md:max-w-xs"
        />
        <p className="mb-8 text-2xl">Federico Verrengia</p>
        <p className="mx-auto max-w-4xl text-center text-gray-400">
          Nato a Prato, classe 1993. <br />
          <br />
          Scopro la passione per il cinema quasi per caso. Fin da bambino mi
          sono ritrovato a guardare film. Memorizzo le battute e comincio a
          conoscere le scene a memoria. Non mi viene mai in mente che potrebbe
          diventare un lavoro.
          <br />
          <br />
          Mi ricordo che il primo video girato era un videoclip per una canzone
          che io stesso avevo scritto.
          <br />
          <br />
          Nel 2017 decido di avvicinarmi al mondo del cinema in maniera più
          professionale iscrivendomi ad un corso di Recitazione cinematografica
          presso la Scuola Cinema Immagina.
          <br />
          <br />
          Capisco che voglio far parte della Settima Arte ma non come attore.
          <br />
          <br />
          Voglio raccontare le mie storie e lo voglio fare con le immagini.
          <br />
          <br />
          Da quel momento dedico tutto il mio tempo a scrivere, leggere,
          analizzare sceneggiature. <br />
          <br />
          Cerco di consolidare continuamente il mestiere dello sceneggiatore e
          quando arrivo ad essere veramente soddisfatto cerco di far partire la
          macchina della produzione per arrivare a dirigere quello che ho
          scritto e le immagini che vedo continumanete dentro la mia
          immaginazione.
        </p>
      </div>
    </section>
  </>
);

export default AboutPage;
