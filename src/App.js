import { PDFDocument } from 'pdf-lib';
import { Fragment, useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import "./App.css";
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.js`;

const App = () => {

  const [pdfBytes, setPdfBytes] = useState(null);
  const [pdfBytesTemp, setPdfBytesTemp] = useState(null);
  const [imageBytes, setImageBytes] = useState(null);
  const [imageSize, setImageSize] = useState(100);
  const [xPosition, setXPosition] = useState(0);
  const [yPosition, setYPosition] = useState(0);

  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);

  function onDocumentLoadSuccess({ numPages }) {
    setNumPages(numPages);
    setPageNumber(1);
  }

  const embedImages = async (image = null, size, xPos, yPos) => {

    const pdfDoc = await PDFDocument.load(pdfBytes);

    const pngImage = image ? await pdfDoc.embedPng(image) : await pdfDoc.embedPng(imageBytes);

    const pngDims = pngImage.scale(parseFloat(size / 100));

    const pages = pdfDoc.getPages();
    const firstPage = pages[0];

    firstPage.drawImage(pngImage, {
      x: xPos,
      y: yPos,
      width:pngDims.width,
      height: pngDims.height,
    })

    const pdfUint = await pdfDoc.save();
    return await Buffer.from(pdfUint).toString('base64');
  }

  const handleUpload = (e) => {

    if(e.target.files[0]){
      const file = e.target.files[0];
        
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onloadend = () => {
            setPdfBytes(reader.result);
            setPdfBytesTemp(reader.result);
      }
    }
  }

  const handleUploadImage = (e) => {

    if(pdfBytes && e.target.files[0]){
      const file = e.target.files[0];
        
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onloadend = () => {
        setImageBytes(reader.result);
        embedImages(reader.result, 100, 0, 0)
        .then((res) => {
            setPdfBytesTemp("data:application/pdf;base64," + res);
          });
      }
    }
  }
  
  const handleChangeValue = async (type, value) => {
    
    if(type === 'imageSize') setImageSize(parseInt(value));
    else if(type === 'xPosition') setXPosition(parseInt(value));
    else if(type === 'yPosition') setYPosition(parseInt(value));
  
    embedImages(null, 
      (type === 'imageSize') ? parseInt(value) : imageSize,
      (type === 'xPosition') ? parseInt(value) : xPosition,
      (type === 'yPosition') ? parseInt(value) : yPosition).then((res) => {
      setPdfBytesTemp("data:application/pdf;base64," + res);
    });  
  }

  return (
    <div>
      <div>
        PDF <br />
        <input type="file" accept="application/pdf" onChange={(e) => handleUpload(e)} />
      </div>
      <div>
        Image <br />
        <input type="file" accept="image/png" onChange={(e) => handleUploadImage(e)} />
        {
          imageBytes &&
          <Fragment>
            <br />
            Image Size
            <input type="number" min={1} max={100} onChange={(e) => handleChangeValue('imageSize', e.target.value)} value={imageSize} />
            <br />
            X Position
            <input type="number" onChange={(e) => handleChangeValue('xPosition', e.target.value)} value={xPosition} />
            <br />
            Y Position
            <input type="number" onChange={(e) => handleChangeValue('yPosition', e.target.value)} value={yPosition} />

          </Fragment>
        }
      </div>
      <a href={pdfBytesTemp} target="_blank" rel="noreferrer" download="pdfEdited.pdf">Download PDF</a>
      {
        pdfBytesTemp != null &&
        <div className="pdf-wrapper">
          <Document
            file={pdfBytesTemp}
            onLoadSuccess={onDocumentLoadSuccess}
          >
            <Page pageNumber={pageNumber} />
          </Document>
          <p>Page {pageNumber} of {numPages}</p>
          <hr />
        </div>
      }
    </div>
  );
}

export default App;
