'use strict';

var datum = function(expt, optc, nprt, erps) 
{
    this.expt = expt;  
    this.optc = optc;
    this.nprt = (nprt == undefined) ? 1 : nprt;
    this.erps = erps;
};

var data = function() 
{
    this.data = [];

    this.to_expt_list = function()
    {
        var expt_list = [];
        for (var i = 0; i < this.data.length; i++) 
            expt_list[i] = this.data[i].expt;
        return expt_list;
    }

    this.to_optc_list = function()
    {
        var optc_list = [];
        for (var i = 0; i < this.data.length; i++) 
            optc_list[i] = this.data[i].optc;
        return optc_list;
    }

    this.to_nprt_list = function()
    {
        var nprt_list = [];
        for (var i = 0; i < this.data.length; i++) 
            nprt_list[i]  = this.data[i].nprt;
        return nprt_list;
    }

    this.to_erps_list = function()
    {
        var erps_list = [];
        for (var i = 0; i < this.data.length; i++) 
            erps_list[i]  = this.data[i].erps;
        return erps_list;
    }

    this.concat = function(new_data)
    {
        for (var i = 0; i < new_data.data.length; i++) 
            this.data.push(new_data.data[i]);
    }
};

var make_datum = function(expt, optc, nprt, erps) 
{
    return new datum(expt, optc, nprt, erps);
};

/*
var make_data = function() 
{
    return new data();
};
*/
var make_data = function(list) 
{
    var dd = new data();
    dd.data = list;
    return dd;
};

var format = function(inputs, kl, sort, nprt, erps) 
{
    var list = new data();
    //console.log(inputs, kl, sort, nprt)
    nprt = (nprt == undefined) ? 1 : nprt;
    for (var i = 0; i < inputs.length; i++)
    {
        var temp_input = (typeof inputs[i] == 'string') ? inputs[i] : JSON.stringify(inputs[i]);
        list.data.push(new datum(temp_input, kl[i], nprt, erps[i]));
    }

    if (sort == true)
        list.data.sort(function(x,y){return y.optc - x.optc;});

    return list;
};

var log = function(data) 
{
    return data.data;
};

module.exports = 
{
    format: format,
    datum: datum,
    data: data,
    make_datum: make_datum,
    make_data: make_data,
    log: log
};

