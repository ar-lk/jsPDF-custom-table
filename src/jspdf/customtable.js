import React from "react";
import jsPDF from "jspdf";

import { sampletabledata } from "./sampledata";

export default class CustomTable extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      sampledata: []
    };
  }

  printPDF = () => {
    const pdf = new jsPDF({
      orientation: "landscape",
      unit: "px",
      format: "a4"
    });

    //if rtl then set rtl
    const optionsL = {
      isInputVisual: false,
      isOutputVisual: true,
      isInputRtl: false,
      isOutputRtl: false,
      align: "right"
    };
    const optionsR = {
      isInputVisual: false,
      isOutputVisual: true,
      isInputRtl: false,
      isOutputRtl: false,
      align: "left"
    };

    let width = pdf.internal.pageSize.getWidth();
    let height = pdf.internal.pageSize.getHeight();

    // Set some general padding to the document
    const pageMargin = 45;
    // Reduce width to get total table width
    const reducetablewidth = width - 90;

    let pageno = 1;
    let tabledrawy = pageMargin;

    let lastaddedpage = null;
    for (const shelfkey in sampletabledata) {
      const fieldshelf = sampletabledata[shelfkey];
      let prodarrobj = [];
      for (let j = 0; j < fieldshelf.length; j++) {
        const shelfsingleobj = fieldshelf[j];

        let prodname = shelfsingleobj.name.toString();
        let prodsupname = (shelfsingleobj.brand &&
        shelfsingleobj.brand.brand &&
        shelfsingleobj.brand.brand.supplier
          ? shelfsingleobj.brand.brand.supplier.supplierName
          : "-"
        ).toString();

        let newprodobj =
          this.props.isRTL === "rtl"
            ? [
                shelfsingleobj.qty,
                prodsupname,
                prodname,
                shelfsingleobj.barcode
              ]
            : [
                shelfsingleobj.barcode,
                prodname,
                prodsupname,
                shelfsingleobj.qty
              ];
        prodarrobj.push(newprodobj);
      }
      // console.log(prodarrobj);

      // Let's set up a standard padding that we can add to known coordinates
      const padding = 15;
      const xPositions = [];

      tabledrawy = tabledrawy === 45 ? tabledrawy + padding : tabledrawy;

      //headers
      pdf.setTextColor("#000000");
      pdf.setFontSize(12);

      pdf.text("Shelf_unit_no: " + shelfkey, pageMargin, tabledrawy, optionsR);
      pdf.text("Field Name -", width - pageMargin, tabledrawy, optionsL);

      //line
      pdf.setLineHeightFactor(5);
      pdf.line(pageMargin, tabledrawy + 5, width - pageMargin, tabledrawy + 5);

      tabledrawy = tabledrawy + 30;

      if (!lastaddedpage || lastaddedpage !== pageno) {
        lastaddedpage = pageno;
        // console.log(JSON.parse(JSON.stringify(data)));
        // //page no
        pdf.setFontSize(11);
        pdf.text("PAGE " + lastaddedpage, pageMargin, 30, optionsR);

        // //shelf and field details
        pdf.setFontSize(12);
        //page footer details
        let bottombranchtxt = "chain name > branch name";
        pdf.text(bottombranchtxt, pageMargin, height - 20, optionsR);

        let bottomusertxt = "January 19 2023 | 11:52:05 | user name";
        pdf.text(bottomusertxt, width - pageMargin, height - 20, optionsL);
      }

      //table
      let headers = [
        { key: "barcode", label: "Barcode", width: 15 },
        { key: "name", label: "Product Name", width: 50 },
        { key: "distributor", label: "Distributor", width: 25 },
        { key: "qty", label: "Facing", width: 10 }
      ];

      let headerxpos = 45; //default start
      headers.forEach((heading, index) => {
        const yPositionForHeaders = tabledrawy;

        pdf.setTextColor("#000000");
        pdf.setFontSize(10);
        pdf.text(
          heading.label,
          index === 0 ? headerxpos : headerxpos + padding,
          yPositionForHeaders
        );

        xPositions.push(index === 0 ? headerxpos + 3 : headerxpos + padding);

        //if last one reset to 45
        const xPositionForCurrentHeader =
          headerxpos + (reducetablewidth / 100) * heading.width;
        headerxpos =
          index + 1 === headers.length ? 45 : xPositionForCurrentHeader;
      });

      tabledrawy = tabledrawy + 20;

      // ROWS
      let tablerowheight = 20;
      let tablecellpadding = 15;
      fieldshelf.forEach((row, rIndex) => {
        const rowHeights = [];
        const rowRectHeights = [];

        tabledrawy = tabledrawy === 45 ? tabledrawy + padding : tabledrawy;

        // COLUMNS
        let newrowcells = [];
        headers.forEach((column, cIndex) => {
          const xPositionForCurrentHeader =
            (reducetablewidth / 100) * column.width - tablecellpadding;

          const longText = pdf.splitTextToSize(
            row[column.key] ? String(row[column.key]) : "-",
            xPositionForCurrentHeader
          );
          // console.log(longText);

          const rowHeight = longText.length * tablerowheight;
          rowHeights.push(rowHeight);

          const rowRectHeight =
            longText.length > 1 ? longText.length * 16 : tablerowheight;
          rowRectHeights.push(rowRectHeight);

          let cellobj = {
            text: longText,
            xpos: xPositions[cIndex],
            ypos: tabledrawy
          };
          newrowcells.push(cellobj);
        });

        let nextrectrowheight =
          Math.max(...rowRectHeights) > tablerowheight
            ? Math.max(...rowRectHeights)
            : tablerowheight;

        pdf.setFillColor(0, 0, 0, 0.05);
        pdf.rect(
          pageMargin,
          tabledrawy - 11,
          reducetablewidth,
          nextrectrowheight - 3,
          "F"
        );

        let nextaddy =
          Math.max(...rowHeights) > tablerowheight
            ? Math.max(...rowHeights)
            : tablerowheight;

        newrowcells.forEach((rowcell, rIndex) => {
          pdf.setTextColor("#555555");
          pdf.setFontSize(10);

          pdf.setLineHeightFactor(1.5);
          pdf.text(rowcell.text, rowcell.xpos, rowcell.ypos);
        });

        tabledrawy = tabledrawy + nextaddy;

        let bottompagemargin = pageMargin * 2;

        if (tabledrawy + bottompagemargin + 10 > height) {
          pdf.addPage();
          tabledrawy = pageMargin;

          pageno = pageno + 1;
        }
      });

      tabledrawy = tabledrawy + 20;
    }

    window.open(pdf.output("bloburl", { filename: "new-file.pdf" }), "_blank");
  };

  render() {
    return (
      <>
        <button type="button" onClick={() => this.printPDF()}>
          Print Test
        </button>
      </>
    );
  }
}
