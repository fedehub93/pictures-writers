export function formatBytes(bytes: number, decimals = 2) {
  if (!+bytes) return "0 Bytes";

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = [
    "Bytes",
    "KiB",
    "MiB",
    "GiB",
    "TiB",
    "PiB",
    "EiB",
    "ZiB",
    "YiB",
  ];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export const formatPrice = (price: number, showFree?: boolean) => {
  if (showFree && price === 0) {
    return "Gratuito";
  }
  return new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR",
  }).format(price);
};
export const formatDate = ({
  date,
  year = "numeric",
  month = "short",
  day = "numeric",
}: {
  date: Date;
  year?: "numeric";
  month?: "short" | "long";
  day?: "numeric";
}) => {
  const newDate = new Date(date);
  const formattedDate = newDate.toLocaleDateString("it-IT", {
    year,
    month,
    day,
  });

  return formattedDate;
};

export const convertToSubcurrency = (amount: number, factor = 100) => {
  return Math.round(amount * factor);
};
