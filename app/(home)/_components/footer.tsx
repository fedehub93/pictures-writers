import Link from "next/link";
import React, { type JSX } from "react";

export const Footer = (): JSX.Element => (
  <footer className="footer">
    <div className="footer__container">
      <div className="footer__mission-container">
        <p className="footer__mission-logo">Pictures Writers</p>
        <p className="mt-2 text-gray-400">
          La nostra missione è alimentare la tua fiamma creativa, fornendoti
          l&apos;ispirazione, l&apos;istruzione e la comunità di supporto di cui
          hai bisogno per diventare uno sceneggiatore di successo.
        </p>
      </div>
      <div className="footer__menu">
        <div className="footer__menu-container">
          <p className="footer__menu-title">About Us</p>
          <ul className="footer__menu-list text-gray-400">
            <li>
              <Link href="/about" prefetch>
                Chi siamo
              </Link>
            </li>
            <li>
              <Link href="/contatti" prefetch>
                Contattaci
              </Link>
            </li>
          </ul>
        </div>
        <div className="footer__menu-container">
          <p className="footer__menu-title">Policy</p>
          <ul className="footer__menu-list text-gray-400">
            <li>
              <Link href="https://www.iubenda.com/privacy-policy/49078580">
                Privacy Policy
              </Link>
            </li>
            <li>
              <Link href="https://www.iubenda.com/privacy-policy/49078580/cookie-policy">
                Cookie Policy
              </Link>
            </li>
            <li>
              <Link href="/policy">Affiliazioni Amazon Policy</Link>
            </li>
          </ul>
        </div>
        <div className="footer__menu-container">
          <p className="footer__menu-title">Risorse</p>
          <ul className="footer__menu-list text-gray-400">
            <li>
              <Link href="/blog" prefetch>
                Blog
              </Link>
            </li>
            <li>
              <Link href="/blog/pagina-uno" prefetch>
                Esempi sceneggiatura
              </Link>
            </li>
            <li>
              <Link href="/feedback-gratuito-sceneggiatura" prefetch>
                Feedback gratuito
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </div>
    <div className="footer__copyright">
      © 2022 Federico Verrengia. All Right Reserved.&nbsp;
      <a className="text-foreground-primary" href="https://storyset.com/people">
        People illustrations by Storyset
      </a>
    </div>
  </footer>
);
