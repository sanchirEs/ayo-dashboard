/**
 * Props for the barcode inputs of the product form.
 *
 * A USB barcode scanner types the code and then presses Enter. In a <form> that Enter
 * submits it, so scanning a box would save a half-filled product. The /barcodes page
 * uses Enter on purpose (it is a scan-and-advance screen); here Enter must do nothing.
 */
export const BARCODE_INPUT_PROPS = {
  inputMode: "numeric",
  autoComplete: "off",
  onKeyDown: (event) => {
    if (event.key === "Enter") event.preventDefault();
  },
};

export const BARCODE_HINT = "Хайрцаг дээрх штрих код (EAN-13). Касс скан хийхэд ашиглагдана. Заавал биш";
