import PaymentPageContent from "../../components/PaymentPageContent";

export default function PagarPage({ params }: { params: { id: string } }) {
  return <PaymentPageContent linkId={params.id} />;
}
