"use client"
import { Button } from "@/components/ui/button";
import { ConfirmModal } from "../(admin)/_components/modals/confirm-modal";

const HomePage = () => {
  return ( <div className="mt-20"><ConfirmModal onConfirm={() => {}}><Button>ciao</Button></ConfirmModal></div> );
}
 
export default HomePage;