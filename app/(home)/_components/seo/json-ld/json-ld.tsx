import React from 'react';
import { Thing, WithContext } from 'schema-dts';

export interface JsonLdProps<GThing extends Thing> {
  json: WithContext<GThing>;
}

export const JsonLd = <GThing extends Thing>({
  json,
}: JsonLdProps<GThing>): JSX.Element => (
  <script
    type="application/ld+json"
    // eslint-disable-next-line react/no-danger
    dangerouslySetInnerHTML={{
      __html: JSON.stringify(json),
    }}
  />
);
