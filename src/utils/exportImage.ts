import html2canvas from 'html2canvas';

export async function exportElementAsImage(
  element: HTMLElement,
  fileName: string = 'sermon-card.png',
  onComplete?: (success: boolean, error?: Error) => void
) {
  try {
    const canvas = await html2canvas(element);
    const dataUrl = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = fileName;
    link.click();
    if (onComplete) onComplete(true);
  } catch (error) {
    if (onComplete) onComplete(false, error as Error);
    console.error('Error exporting image:', error);
  }
}

export async function shareImage(
  element: HTMLElement,
  fileName: string = 'sermon-card.png',
  onComplete?: (success: boolean, error?: Error) => void
) {
  try {
    const canvas = await html2canvas(element);
    const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/png'));
    if (
      blob &&
      navigator.canShare &&
      navigator.canShare({ files: [new File([blob], fileName, { type: 'image/png' })] })
    ) {
      const file = new File([blob], fileName, { type: 'image/png' });
      await navigator.share({ files: [file], title: 'Sermon Card', text: 'Check out this sermon card!' });
      if (onComplete) onComplete(true);
    } else {
      await exportElementAsImage(element, fileName, onComplete);
    }
  } catch (error) {
    if (onComplete) onComplete(false, error as Error);
    console.error('Error sharing image:', error);
  }
}
