'use strict';

var p = function(x, p) 
{
    this.x = x;  
    this.p = p;
};

var pmf = function() 
{
    this.pmf = [];  

    this.from_erp = function(erp)
    {
        for (var i = 0; i < erp.support([]).length; i++) 
            this.pmf[i] = new p(erp.support([])[i], 
                                Math.exp(erp.score([], erp.support([])[i])));
    }

    this.normalize = function()
    {
        var sum = 0;
        for (var i = 0; i < this.pmf.length; i++) 
            sum += this.pmf[i].p;

        if (sum != 0) 
            for (var i = 0; i < this.pmf.length; i++) 
                this.pmf[i].p /= sum;
    }

    this.to_x_list = function()
    {
        var x_list = [];
        for (var i = 0; i < this.pmf.length; i++) 
            x_list[i] = this.pmf[i].x;
        return x_list;
    }

    this.to_p_list = function()
    {
        var p_list = [];
        for (var i = 0; i < this.pmf.length; i++) 
            p_list[i] = this.pmf[i].p;
        return p_list;
    }
};

module.exports = 
{
    p: p,
    pmf: pmf
};

