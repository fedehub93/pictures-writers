import { CustomElement } from "./components/editor";

declare global {
  namespace PrismaJson {
    type BodyData = CustomElement[];
    type EmailDesignData = any;
  }
}
