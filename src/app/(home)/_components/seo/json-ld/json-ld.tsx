import React, { type JSX } from "react";
import { Graph, Thing, WithContext } from "schema-dts";

export type JsonLdData = WithContext<Thing> | Graph;

export interface JsonLdProps {
  json: JsonLdData;
}

export const JsonLd = ({ json }: JsonLdProps): JSX.Element => (
  <script
    type="application/ld+json"
    dangerouslySetInnerHTML={{
      __html: JSON.stringify(json),
    }}
  />
);
