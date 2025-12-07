
/**
 * Captures an HTML element as an image with added margins/padding to simulate a "card on a surface" look.
 * uses html2canvas.
 */
export const captureCardWithMargins = async (element: HTMLElement, filename: string) => {
  // 1. Create a wrapper to provide the margins (gaps)
  const wrapper = document.createElement('div');
  Object.assign(wrapper.style, {
    position: 'fixed',
    left: '-9999px',
    top: '0',
    padding: '30px', // Reduced padding for a smaller gap around the card
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent', // Transparent background
    zIndex: '-9999',
  });

  // 2. Clone the element to avoid modifying the live DOM
  const clone = element.cloneNode(true) as HTMLElement;

  // 3. Reset styles on the clone for a clean "Digital Asset" look
  // We remove the specific positioning and rotation of the desk, making it straight and centered.
  Object.assign(clone.style, {
    position: 'relative',
    left: 'auto',
    top: 'auto',
    transform: 'rotate(0deg) scale(1)', // Reset rotation and scale
    margin: '0',
    boxShadow: '5px 10px 30px rgba(0,0,0,0.2)', // Ensure a nice consistent shadow
    transition: 'none',
  });

  // 4. Append
  wrapper.appendChild(clone);
  document.body.appendChild(wrapper);

  try {
    // 5. Generate Canvas
    // @ts-ignore - html2canvas is loaded via CDN
    const canvas = await window.html2canvas(wrapper, {
      backgroundColor: null, // Ensures transparent background outside the card
      scale: 2, // High resolution
      logging: false,
      useCORS: true,
      ignoreElements: (element: Element) => {
        // Double check ignoring elements marked for ignore
        return element.hasAttribute('data-html2canvas-ignore');
      }
    });

    // 6. Download
    const link = document.createElement('a');
    link.download = filename;
    link.href = canvas.toDataURL('image/png');
    link.click();
  } catch (err) {
    console.error("Image generation failed:", err);
  } finally {
    // 7. Cleanup
    if (document.body.contains(wrapper)) {
      document.body.removeChild(wrapper);
    }
  }
};
