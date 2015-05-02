"use strict";

var activeCodeBox;

// Utils

function euclideanDistance(v1, v2){
  var i;
  var d = 0;
  for (i = 0; i < v1.length; i++) {
    d += (v1[i] - v2[i])*(v1[i] - v2[i]);
  }
  return Math.sqrt(d);
};

function isErp(x){
  return (x && (x.score != undefined) && (x.sample != undefined));
}

function isErpWithSupport(x){
  return (isErp(x) && (x.support != undefined));
}

function jsPrint(x){
  var resultDiv = $(activeCodeBox.parent().find(".resultDiv"));
  resultDiv.show();
  if (isErpWithSupport(x)){
    var params = Array.prototype.slice.call(arguments, 2);
    var labels = x.support(params);
    var scores = _.map(labels, function(label){return x.score(params, label);});
    if (_.find(scores, isNaN) !== undefined){
      resultDiv.append(document.createTextNode("ERP with NaN scores!\n"));
      return;
    }
    var counts = scores.map(Math.exp);
    var resultDivSelector = "#" + resultDiv.attr('id');
    barChart(resultDivSelector, labels, counts);
  } else {
    resultDiv.append(
      document.createTextNode(
        JSON.stringify(x) + "\n"));
  }
}

function hist(s, k, a, lst) {
  var resultDiv = $(activeCodeBox.parent().find(".resultDiv"));
  var frequencyDict = _(lst).countBy(function(x) { return x + ""});
  var labels = _(frequencyDict).keys();
  var counts = _(frequencyDict).values();

  var resultDivSelector = "#" + resultDiv.attr('id');

  return k(s, barChart(resultDivSelector, labels, counts));
}

function print(store, k, a, x){
  jsPrint(x);
  return k(store);
}

function oed_print_erps(store, k, a, x){
  var resultDiv = $(activeCodeBox.parent().find(".resultDiv"));
  resultDiv.show();
  for (var i = 0; i < x.length; i++) {
    resultDiv.append(document.createTextNode("Model " + i + " distribution: \n"));
    distribution_chart(resultDiv, x[i]); 
  }
  return k(store);
}

function oed_print_kl(store, k, a, x){
    var resultDiv = $(activeCodeBox.parent().find(".resultDiv"));
    resultDiv.show();
    var resultDivSelector = "#" + resultDiv.attr('id');
    var data = x[0];
    var xlabel = (x[1] == undefined) ? null : x[1];
    var ylabel = (x[2] == undefined) ? null : x[2];
    bar_chart(resultDivSelector, data, xlabel, ylabel);
    return k(store);
}

function oed_print_kl_participants(store, k, a, x){
    var resultDiv = $(activeCodeBox.parent().find(".resultDiv"));
    resultDiv.show();
    var resultDivSelector = "#" + resultDiv.attr('id');
    var data = x[0];
    var xlabel = (x[1] == undefined) ? null : x[1];
    var ylabel = (x[2] == undefined) ? null : x[2];
    line_chart(resultDivSelector, data, xlabel, ylabel);
    return k(store);
}

// Bar plots

function barChart(containerSelector, labels, counts){
  $(containerSelector).show();
  var svg = d3.select(containerSelector)
    .append("svg")
    .attr("class", "chart");
  var data = [];
  for (var i=0; i<labels.length; i++){
    if (counts[i] > 0) {
      data.push({
        "Label": JSON.stringify(labels[i]),
        "Count": counts[i]
      });
    }
  };
  var chart = new dimple.chart(svg, data);
  chart.setBounds(80, 30, 480, 250);
  var xAxis = chart.addMeasureAxis("x", "Count");
  xAxis.title = null;
  xAxis.tickFormat = ",.2f";
  var yAxis = chart.addCategoryAxis("y", "Label");
  yAxis.title = null;
  chart.addSeries("Count", dimple.plot.bar);
  chart.draw();
}

function sortAlphaNum(a,b) {
  var reA = /[^a-zA-Z]/g;
  var reN = /[^0-9.]/g;
  var aA = a.replace(reA, "");
  var bA = b.replace(reA, "");
  if(aA === bA) {
    var aN = parseFloat(a.replace(reN, ""), 10);
    var bN = parseFloat(b.replace(reN, ""), 10);
    return aN === bN ? 0 : aN > bN ? 1 : -1;
  } else {
    return aA > bA ? 1 : -1;
  }
}

// OED plots
function dist_chart(containerSelector, labels, counts){
  $(containerSelector).show();
  var svg = d3.select(containerSelector)
    .append("svg")
    .attr("class", "dis_chart");
  var data = [];
  for (var i=0; i<labels.length; i++){
    if (counts[i] > 0) {
      data.push({
        "Label": JSON.stringify(labels[i]),
        "Count": counts[i]
      });
    }
  };
  var chart = new dimple.chart(svg, data);
  chart.setBounds(80, 20, 480, 110);
  var yAxis = chart.addMeasureAxis("y", "Count");
  yAxis.title = "Probability";
  yAxis.tickFormat = ",.2f";
  var xAxis = chart.addCategoryAxis("x", "Label");
  xAxis.title = "Response";
  xAxis.addOrderRule(function(x,y){return sortAlphaNum(x.Label, y.Label);});

  var series = chart.addSeries(undefined, dimple.plot.bar);

  chart.draw();
}

function distribution_chart(box, x){
  var params = Array.prototype.slice.call(arguments, 2);
  var labels = x.support(params);
  var scores = _.map(labels, function(label){return x.score(params, label);});
  if (_.find(scores, isNaN) !== undefined){
    resultDiv.append(document.createTextNode("ERP with NaN scores!\n"));
    return;
  }
  var counts = scores.map(Math.exp);
  var boxSelector = "#" + box.attr('id');
  dist_chart(boxSelector, labels, counts);
}

function generate_bar_distributions(e, data)
{
  var expt_index = -1;
  for (var i = 0; i < data.length; i++)
    if (data[i].expt == e.cy)
      expt_index = i;

  var resultPlus = $(activeCodeBox.parent().find(".resultPlus"));
  resultPlus.empty();
  resultPlus.show();
  var erps = data[expt_index].erps;
  resultPlus.append(document.createTextNode("Experiment: " + data[expt_index].expt + " \n\n"));
  for (var i = 0; i < erps.length; i++) {
    resultPlus.append(document.createTextNode("Model " + i + " distribution: \n"));
    distribution_chart(resultPlus, erps[i]); 
  }
}

function bar_chart(containerSelector, data, xlabel, ylabel){
  $(containerSelector).show();
  var svg = d3.select(containerSelector)
    .append("svg")
    .attr("class", "chart");
  var expt = data.to_expt_list();
  var optc = data.to_optc_list();
  var erps = data.to_erps_list();
  //console.log(erps)
  var chart_data = [];
  for (var i = 0; i < expt.length; i++){
    chart_data.push({
      "expt": (typeof expt[i] == 'string') ? expt[i] : JSON.stringify(expt[i]),
      "kl": optc[i],
      "erps": erps[i]
    });
  };
  var chart = new dimple.chart(svg, chart_data);
  chart.setBounds(80, 30, 480, 250);
  var xAxis = chart.addMeasureAxis("x", "kl");
  xAxis.title = xlabel;
  xAxis.tickFormat = ",.2f";
  var yAxis = chart.addCategoryAxis("y", "expt");
  yAxis.title = ylabel;
  var series = chart.addSeries(undefined, dimple.plot.bar);
  chart.draw();

  series.shapes.on("click", function (e){generate_bar_distributions(e, chart_data) });
}

function generate_line_distributions(e, data)
{
  var expt_index = -1;
  for (var i = 0; i < data.length; i++)
    if ((data[i].npart == e.data[0].cx) && (data[i].kl == e.data[0].cy))
      expt_index = i;

  var resultPlus = $(activeCodeBox.parent().find(".resultPlus"));
  resultPlus.empty();
  resultPlus.show();
  var erps = data[expt_index].erps;
  resultPlus.append(document.createTextNode("Experiment: " + data[expt_index].expt + " \n\n"));
  for (var i = 0; i < erps.length; i++) {
    resultPlus.append(document.createTextNode("Model " + i + " distribution: \n"));
    distribution_chart(resultPlus, erps[i]); 
  }
}

function line_chart(containerSelector, data, xlabel, ylabel){
  $(containerSelector).show();
  var svg = d3.select(containerSelector)
    .append("svg")
    .attr("class", "chart");
  var expt = data.to_expt_list();
  var optc = data.to_optc_list();
  var nprt = data.to_nprt_list();
  var erps = data.to_erps_list();
  var chart_data = [];
  for (var i = 0; i < nprt.length; i++){
    chart_data.push({
      "expt": (typeof expt[i] == 'string') ? expt[i] : JSON.stringify(expt[i]),
      "npart": nprt[i],
      "kl": optc[i],
      "erps": erps[i],
    });
  };
  var chart = new dimple.chart(svg, chart_data);
  chart.setBounds(80, 30, 480, 250);
  var xAxis = chart.addCategoryAxis("x", "npart");
  xAxis.title = xlabel;
  xAxis.tickFormat = ",.2f";
  var yAxis = chart.addMeasureAxis("y", "kl");
  yAxis.title = null;
  yAxis.title = ylabel;
  var series = chart.addSeries("expt", dimple.plot.line);
  chart.draw();

  series.shapes.on("click", function (e){generate_line_distributions(e, chart_data) });
}


// Drawing

function DrawObject(width, height, visible){
  this.canvas = $('<canvas/>', {
    "class": "drawCanvas",
    "Width": width + "px",
    "Height": height + "px"
  })[0];
  if (visible==true){
    $(this.canvas).css({"display": "inline"});
    $(activeCodeBox).parent().append(this.canvas);
  };
  this.paper = new paper.PaperScope();
  this.paper.setup(this.canvas);
  this.paper.view.viewSize = new this.paper.Size(width, height);
  this.redraw();
}

DrawObject.prototype.newPath = function(strokeWidth, opacity, color){
  var path = new this.paper.Path();
  path.strokeColor = color || 'black';
  path.strokeWidth = strokeWidth || 8;
  path.opacity = opacity || 0.6;
  return path;
};

DrawObject.prototype.newPoint = function(x, y){
  return new this.paper.Point(x, y);
};

DrawObject.prototype.circle = function(x, y, radius, stroke, fill){
  var point = this.newPoint(x, y);
  var circle = new this.paper.Path.Circle(point, radius || 50);
  circle.fillColor = fill || 'black';
  circle.strokeColor = stroke || 'black';
  this.redraw();
};

DrawObject.prototype.polygon = function(x, y, n, radius, stroke, fill){
  var point = this.newPoint(x, y);
  var polygon = new this.paper.Path.RegularPolygon(point, n, radius || 20);
  polygon.fillColor = fill || 'white';
  polygon.strokeColor = stroke || 'black';
  polygon.strokeWidth = 4;
  this.redraw();
};

DrawObject.prototype.line = function(x1, y1, x2, y2, strokeWidth, opacity, color){
  var path = this.newPath(strokeWidth, opacity, color);
  path.moveTo(x1, y1);
  path.lineTo(this.newPoint(x2, y2));
  this.redraw();
};

DrawObject.prototype.redraw = function(){
  this.paper.view.draw();
};

DrawObject.prototype.toArray = function(){
  var context = this.canvas.getContext('2d');
  var imgData = context.getImageData(0, 0, this.canvas.width, this.canvas.height);
  return imgData.data;
};

DrawObject.prototype.distanceF = function(f, cmpDrawObject){
  if (!((this.canvas.width == cmpDrawObject.canvas.width) &&
        (this.canvas.height == cmpDrawObject.canvas.height))){
    console.log(this.canvas.width, cmpDrawObject.canvas.width,
                this.canvas.height, cmpDrawObject.canvas.height);
    throw new Error("Dimensions must match for distance computation!");
  }
  var thisImgData = this.toArray();
  var cmpImgData = cmpDrawObject.toArray();
  return f(thisImgData, cmpImgData);
};

DrawObject.prototype.distance = function(cmpDrawObject){
  var df = function(thisImgData, cmpImgData) {
    var distance = 0;
    for (var i=0; i<thisImgData.length; i+=4) {
      var col1 = [thisImgData[i], thisImgData[i+1], thisImgData[i+2], thisImgData[i+3]];
      var col2 = [cmpImgData[i], cmpImgData[i+1], cmpImgData[i+2], cmpImgData[i+3]];
      distance += euclideanDistance(col1, col2);
    };
    return distance;
  };
  return this.distanceF(df, cmpDrawObject)
};

DrawObject.prototype.destroy = function(){
  this.paper = undefined;
  $(this.canvas).remove();
}

function Draw(s, k, a, width, height, visible){
  return k(s, new DrawObject(width, height, visible));
}

function loadImage(s, k, a, drawObject, url){
  // Synchronous loading - only continue with computation once image is loaded
  var context = drawObject.canvas.getContext('2d');
  var imageObj = new Image();
  imageObj.onload = function() {
    var raster = new drawObject.paper.Raster(imageObj);
    raster.position = drawObject.paper.view.center;
    drawObject.redraw();
    var trampoline = k(s);
    while (trampoline){
      trampoline = trampoline();
    }
  };
  imageObj.src = url;
  return false;
}


// Code boxes

function webpplObjectToText(x){
  if (isErp(x)){
    return "<erp>";
  } else {
    return JSON.stringify(x);
  }
}

var codeBoxCount = 0;

CodeMirror.keyMap.default["Cmd-/"] = "toggleComment";
CodeMirror.keyMap.default["Cmd-."] = function(cm){cm.foldCode(cm.getCursor(), myRangeFinder); };

//fold "///fold: ... ///" parts:
function foldCode(cm){
  var lastLine = cm.lastLine();
  for(var i=0;i<=lastLine;i++) {
    var txt = cm.getLine(i),
    pos = txt.indexOf("///fold:");
    if (pos==0) {cm.foldCode(CodeMirror.Pos(i,pos), tripleCommentRangeFinder);}
  }
}

function setupCodeBox(element){
  var $element = $(element);
  var $code = $element.html();
  var $unescaped = $('<div/>').html($code).text();

  $element.empty();

  var cm = CodeMirror(
    element, {
      value: $unescaped,
      mode: 'javascript',
      lineNumbers: false,
      readOnly: false,
      extraKeys: {"Tab": "indentAuto"}
    });

  foldCode(cm);

  var getLanguage = function(){
    var firstLine = cm.getValue().split("\n")[0];
    if (firstLine == "// language: javascript") {
      return "javascript";
    } else if (firstLine == "// static") {
      return "static";
    } else {
      return "webppl";
    }
  };

  var resultDiv = $('<div/>',
    { "id": "result_" + codeBoxCount,
      "class": "resultDiv" });

  var resultPlus = $('<div/>',
    { "id": "resultplus_" + codeBoxCount,
      "class": "resultPlus" });

  var showResult = function(store, x){
    if (x !== undefined) {
      resultDiv.show();
      resultDiv.append(document.createTextNode(webpplObjectToText(x)));
    }
  };

  var showResultPlus = function(store, x){
    if (x !== undefined) {
      resultPlus.show();
      resultPlus.append(document.createTextNode(webpplObjectToText(x)));
    }
  };

  var runWebPPL = function(){
    var oldActiveCodeBox = activeCodeBox;
    activeCodeBox = $element;
    activeCodeBox.parent().find("canvas").remove();
    activeCodeBox.parent().find(".resultDiv").text("");
    var compiled = webppl.compile(cm.getValue(), true);
    eval.call(window, compiled)({}, showResult, '');
  };

  var runJS = function(){
    activeCodeBox = $element;
    activeCodeBox.parent().find("canvas").remove();
    activeCodeBox.parent().find(".resultDiv").text("");
    try {
      var result = eval.call(window, cm.getValue());
      showResult({}, result);
    } catch (err) {
      resultDiv.show();
      resultDiv.append(document.createTextNode((err.stack)));
      throw err;
    }
  };

  var runButton = $(
    '<button/>', {
      "text": "run",
      "id": 'run_' + codeBoxCount,
      "class": 'runButton',
      "click": function(){
        return (getLanguage() == "javascript") ? runJS() : runWebPPL();
      }
    });

  var runButtonDiv = $("<div/>");
  runButtonDiv.append(runButton);

  if (getLanguage() == "static"){
    cm.setValue(cm.getValue().split("\n").slice(1).join("\n").trim());
  } else {
    $element.parent().append(runButtonDiv);
  }

  $element.parent().append(resultDiv);
  $element.parent().append(resultPlus);

  codeBoxCount += 1;

  return cm;
}

function setupCodeBoxes(){
  $('pre > code').each(function() {
    setupCodeBox(this);
  });
}

$(setupCodeBoxes);


// CPS and addressing forms

function updateTransformForm(inputId, outputId, transformer){
  try {
    var cpsCode = transformer($(inputId).val());
    $(outputId).val(cpsCode);
  } catch (err) {
  }
  $(outputId).trigger('autosize.resize');
}

function setupTransformForm(inputId, outputId, eventListener){
  $(inputId).autosize();
  $(outputId).autosize();
  $(inputId).bind('input propertychange', eventListener);
  $(inputId).change();
  eventListener();
}

// CPS

var updateCpsForm = function(){
  updateTransformForm("#cpsInput", "#cpsOutput", webppl.cps);
};
var setupCpsForm = function(){
  setupTransformForm("#cpsInput", "#cpsOutput", updateCpsForm);
};

$(function(){
  if ($("#cpsInput").length){
    $(setupCpsForm);
  }
});


// Naming

var updateNamingForm = function(){
  updateTransformForm("#namingInput", "#namingOutput", webppl.naming);
};
var setupNamingForm = function(){
  setupTransformForm("#namingInput", "#namingOutput", updateNamingForm);
};

$(function(){
  if ($("#namingInput").length){
    $(setupNamingForm);
  }
});


// Google analytics

/*
(function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
(i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
})(window,document,'script','//www.google-analytics.com/analytics.js','ga');

ga('create', 'UA-54996-12', 'auto');
ga('send', 'pageview');
*/


// Date

function setDate(){
  var today = new Date();
  var dd = today.getDate();
  var mm = today.getMonth() + 1; //January is 0!
  var yyyy = today.getFullYear();
  $(".date").text(yyyy+'-'+mm+'-'+dd);
}

$(setDate);


// Bibtex

function setBibtex(){
  $('#toggle-bibtex').click(function(){$('#bibtex').toggle(); return false;});
}

$(setBibtex)

// Special functions for webppl code boxes

var invertMap = function (store, k, a, obj) {

  var newObj = {};

  for (var prop in obj) {
    if (obj.hasOwnProperty(prop)) {
      var value = obj[prop];
      if (newObj.hasOwnProperty(value)) {
        newObj[value].push(prop);
      } else {
        newObj[value] = [prop];
      }
    }
  }

  return k(store, newObj);
};
