(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

var list_copy = function(l)
{
    var ll = [];
    for (var i = 0; i < l.length; i++)
        ll[i] = l[i];

    return ll;
}

var list_swap = function(l, i, j)
{
    var temp = l[i];
    l[i] = l[j];
    l[j] = temp;
}

var list_iterative_concat = function(list, crosser) 
{
    var iterations = [];
    for (var i = 0; i < list.length; i++)
    {
        for (var j = 0; j < crosser.length; j++)
        {
            var list_temp = list_copy(list[i]);

            list_temp.push(crosser[j])
            iterations.push(list_temp)
        }
    }

    return iterations;
};

var list_product = function(list) 
{
    var products = [[]];
    for (var i = 0; i < list.length; i++)
        products = list_iterative_concat(products, list[i]);

    return products;
};

/*
//Heap's algorithm
function list_permute(array, list, index) 
{
    if (index == 1)
    {
        var list_cp = list_copy(list);
        array.push(list_cp);
    }
    else
        for (var i = 0; i < index; i++)
        {
            list_permute(array, list, index-1);
            var j = ((index% 2) == 1) ? i : 0;
            list_swap(list, j, index-1);
        }
}

function list_permutations(list, len) 
{
    var len = (len == undefined) ? (list.length) : len;

    var list_cp = list_copy(list);

    var permutations = [];
    list_permute(permutations, list_cp, len);
    return permutations;
};
*/

var list_permute_concat = function(list, head, tail, len) 
{
    if (head.length == len)
        list.push(head);
    else
    {
        for (var i = 0; i < tail.length; i++)
        {
            var head_cp = list_copy(head);
            var tail_cp = list_copy(tail);
            head_cp.push(tail_cp.splice(i,1)[0]);
            list_permute_concat(list, head_cp, tail_cp, len);
        }
    }
};

var list_permutations = function(list, len) 
{
    var len = (len == undefined) ? (list.length) : len;

    var permutations = [];
    list_permute_concat(permutations, [], list, len);

    return permutations;
};

/*
function list_combinations(array) 
{
};

function list_combinations_with_replacement(array) 
{
};
*/

module.exports = 
{
    list_product: list_product, 
    list_permutations: list_permutations
};


},{}],2:[function(require,module,exports){
'use strict';

var pmf = require('./pmf.js');
var comb = require('./comb.js');
var print = require('./print.js');
//var cps = require('./cps_header.js');

// PMF helper functions 

var normalize = function(x)
{
    var sum = 0;
    for (var i = 0; i < x.length; i++) 
        sum += x[i];

    if (sum != 0) 
        for (var i = 0; i < x.length; i++) 
            x[i] /= sum;
    return x;
};

var erp_to_pmf = function(erp_list) 
{
    var pmf_list = [];
    for (var i = 0; i < erp_list.length; i++) 
    {
        pmf_list[i] = new pmf.pmf();
        pmf_list[i].from_erp(erp_list[i]);
        pmf_list[i].normalize();
    }
    return pmf_list;
};

var homogenize_pmf_list = function(pmf_list) 
{
    var hpmf_list = [];

    var all_x_list = pmf_list[0].to_x_list();
    for (var i = 1; i < pmf_list.length; i++) 
    {
        var x_list = pmf_list[i].to_x_list();
        for (var j = 0; j < x_list.length; j++)
        {
            var duplicate_x = false;
            for (var k = 0; k < all_x_list.length; k++)
            {
                if (x_list[j] == all_x_list[k])
                {
                    duplicate_x = true;
                    break;
                }
            }

            if (!duplicate_x)
                all_x_list.push(x_list[j]);
        }
    }
    
    if (typeof(all_x_list[0]) == 'number')
        all_x_list.sort(function(a,b){return a-b;});
    else
        all_x_list.sort();

    for (var i = 0; i < pmf_list.length; i++) 
    {
        hpmf_list[i] = new pmf.pmf();
        
        for (var j = 0; j < all_x_list.length; j++)
        {
            var x_list = pmf_list[i].to_x_list();
            var x_index = undefined;
            for (var k = 0; k < x_list.length; k++)
            {
                if (all_x_list[j] == x_list[k])
                {
                    x_index = k;
                    break;
                }
            }

            if (x_index == undefined)
                hpmf_list[i].pmf.push(new pmf.p(all_x_list[j], 0));
            else
                hpmf_list[i].pmf.push(pmf_list[i].pmf[x_index]);
        }

        hpmf_list[i].normalize();
    }

    return hpmf_list;
};

// Expected KL for a set of distributions

var get_expected_kl = function(erp_list, model_belief) 
{
    var model_belief = normalize(model_belief)
    if (erp_list.length != model_belief.length)
        return 'Error: The number of models (' + erp_list.length + ') is not equal to the belief distribution of models(' + model_belief.length + ')'

    var pmf_list = homogenize_pmf_list(erp_to_pmf(erp_list));
    
    var expected_kl = 0;
    for (var i = 0; i < pmf_list[0].pmf.length; i++)
    {
        var p_response = 0;
        for (var m = 0; m < pmf_list.length; m++)
            p_response += pmf_list[m].pmf[i].p*model_belief[m];
        for (var m = 0; m < pmf_list.length; m++)
            if (pmf_list[m].pmf[i].p != 0)
                expected_kl += pmf_list[m].pmf[i].p*model_belief[m]*Math.log(pmf_list[m].pmf[i].p/p_response);
    }
    return expected_kl;
};

// Expected KL for a given number of participants

var multinomial_sample = function(array) 
{
    var x = Math.random();
    var prob_accumulator = 0;

    for (var i = 0; i < array.length; i++) 
    {
        prob_accumulator += array[i];
        if (prob_accumulator >= x) {return i;};
    }
    return array.length;
};

var get_participants_sampler = function(pmf_list, num_participants, num_samples) 
{
    var sample_counter = [];
    for (var m = 0; m < pmf_list.length; m++)
    {
        sample_counter[m] = [];
        for (var i = 0; i < num_samples; i++)
        {
            var sample_participant = [];
            var p_list = pmf_list[m].to_p_list();
            for (var j = 0; j < p_list.length; j++)
                sample_participant[j] = 0;

            for (var j = 0; j < num_participants; j++)
                sample_participant[multinomial_sample(p_list)] += 1;

            var sps = sample_participant.toString();
                
            sample_counter[m][sps] = (sample_counter[m][sps] == undefined) ? 1 : 
                                     sample_counter[m][sps] + 1;
        }
    }
            
    return sample_counter;
};

var get_entropy_of_response_participants_sample = function(pmf_list, model_belief, sample_counter, num_participants, num_samples)
{
    var joint_sample_counter_keys = [];
    for (var m = 0; m < pmf_list.length; m++)
        for (var sc in sample_counter[m])
            if (joint_sample_counter_keys.indexOf(sc) == -1)
                joint_sample_counter_keys.push(sc);

    var p_response_sample = []
    for (var i = 0; i < joint_sample_counter_keys.length; i++)
    {
        p_response_sample[i] = 0;
        for (var m = 0; m < pmf_list.length; m++)
        {
            var sc = sample_counter[m][joint_sample_counter_keys[i]];
            p_response_sample[i] += (sc == undefined) ? 0 : 
                                    model_belief[m]*sc/num_samples;
        }
    }

    var sum_p_response_sample = 0;
    for (var i = 0; i < p_response_sample.length; i++)
        sum_p_response_sample += p_response_sample[i];

    for (var i = 0; i < p_response_sample.length; i++)
        p_response_sample[i] /= sum_p_response_sample;

    var h_response = 0;
    for (var i = 0; i < p_response_sample.length; i++)
        if (p_response_sample[i] != 0)
            h_response -= p_response_sample[i]*Math.log(p_response_sample[i])

    return h_response;
};

var get_entropy_of_response_given_models_participants_sample = function(pmf_list, model_belief, sample_counter, num_participants, num_samples)
{
    var h_response_g_model = 0;
    for (var m = 0; m < pmf_list.length; m++)
    {
        var h_response_g_model_sample = 0;
        for (var sc in sample_counter[m])
        {
            var p_response_g_model_sample = sample_counter[m][sc]/num_samples;
            if (p_response_g_model_sample != 0)
                h_response_g_model_sample += p_response_g_model_sample*Math.log(p_response_g_model_sample)
        }
        h_response_g_model -= model_belief[m]*h_response_g_model_sample
    }
    return h_response_g_model;
};

var get_expected_kl_participants_sample = function(erp_list, model_belief, num_participants, num_samples) 
{
    var model_belief = normalize(model_belief)
    if (erp_list.length != model_belief.length)
        return 'Error: The number of models (' + erp_list.length + ') is not equal to the belief distribution of models(' + model_belief.length + ')'

    var pmf_list = homogenize_pmf_list(erp_to_pmf(erp_list));

    var sample_counter = get_participants_sampler(pmf_list, num_participants, num_samples);

    var h_response = get_entropy_of_response_participants_sample(pmf_list, model_belief, sample_counter, num_participants, num_samples);
    var h_response_g_model = get_entropy_of_response_given_models_participants_sample(pmf_list, model_belief, sample_counter, num_participants, num_samples);
    
    return h_response - h_response_g_model;
};

// Helper functions

var list_copy = function(l)
{
    var ll = [];
    for (var i = 0; i < l.length; i++)
        ll[i] = l[i];

    return ll;
}

var find_nearest = function(array, value)
{
    var arr_cp = list_copy(array);

    for (var i = 0; i < arr_cp.length; i++)
        arr_cp[i] -= value;

    for (var i = 0; i < arr_cp.length; i++)
        arr_cp[i] = Math.abs(arr_cp[i]);

    var smallest = arr_cp[0]
    var smallest_index = 0;
    for (var i = 1; i < arr_cp.length; i++)
        if (arr_cp[i] < smallest)
        {
            smallest = arr_cp[i];
            smallest_index = i;
        }

    return array[smallest_index];
}

// Compute

/*
OED({models: [models…], 
     priors: [model priors…], //if omitted then uniform
     experiments: […],
     linkingfn: foo, //if omitted assume identity. how do you indicate it’s parameters and their priors?
     other params?})
*/

/*
var cps_map = function(s, k, a, fn, ar) {
    //var ff = fn;
    //console.log('ff: ', ff)
    return ar.length == 0 ? [] : [fn(s, k, a, ar[0])].concat(cps_map(s, k, a, fn, ar.slice(1)));
};
*/

/*
var cps_for_each = function(s, k, a, fn, ar) {
    //var ff = fn;
    //console.log('ff: ', ff)
    return ar.length == 0 ? [] : [fn(s, k, a, ar[0])].concat(cps_map(s, k, a, fn, ar.slice(1)));
};

function cps_for_each(s, k, a, fn, xs, i) {
    i = (i === undefined) ? 0 : i;
    if (i === xs.length) {
        return k();
    } else {
        return fn(s, k, a, xs[i], i, xs, function() {
            return cps_for_each(s, k, a, fn, xs, i + 1);
        });
    }
}
*/

/*
function cps_for_each(func, nextK, xs, i) {
  i = (i === undefined) ? 0 : i;
  if (i === xs.length) {
    return nextK();
  } else {
    //console.log("func:", func)
    return func(xs[i], i, xs, function() {
      return cps_for_each(func, nextK, xs, i + 1);
    });
  }
}

var base_cont = function(s, v) {console.log("bc:", v); return [v]};

function cps_map(func, baseK, xs, i) {
  i = (i === undefined) ? xs.length-1 : i;
  if (i == 0) {
    console.log("done", i, xs[i], baseK)
    return func(xs[i], i, xs, baseK);
  } else {
    console.log("running", i, xs[i], baseK)
    return cps_map(func, 
                   function(s, v) {return [v].concat(func(xs[i], i, xs, baseK));},
                   xs,
                   i-1);
  }
}

var untrampoline = function(fn) {
    while (typeof(fn) === 'function') {
        //console.log("untramp", fn);
        untrampoline(fn());
    }
    return fn;
}

var cps_exec = function(s, k, a, func, args) {
    //console.log("func: ", func)
    var exec = func(s, k, a, args);
    //console.log("func: ", func)
    return exec;
};

var compute = function(s, k, a, oed_params) 
{
    console.log(oed_params)
    var data = print.data();

    //to do: model input check
    var oed_models = oed_params.models;

    var oed_priors = (oed_params.models_prior == undefined) ? cps.make_list(models.length, 1/models.length()) :
                                                              cps.normalize_list(oed_params.models_prior);

    var oed_nparts = (oed_params.num_participants == undefined) ? [1] :
                                                                 oed_params.num_participants;
    //to do: experiment input check
    var oed_expts = oed_params.experiments;

    if (oed_nparts.length == 1)
    {
        //var xx = cps.map(function(expt) {
        //            return cps.map(function(model) {return model(s, k, a, expt);}, oed_models)}, oed_expts)
        //var exec_model = oed_models[0];
        //console.log(exec_model)
        //var xx = cps_exec(s, k, a, exec_model, oed_expts[0]);
        //console.log(xx)
        //var xx = cps_map(s, k, a, function(s, k, a, model) {return cps_exec(s, k, a, model, oed_expts[0]);}, oed_models)
        //cps_for_each(s, k, a, cps_exec);
        //console.log(oed_models[0](oed_expts[0]));
        console.log(oed_models[0])
        //console.log(cps_exec(s, k, a
        //var xx = oed_models[0];
        //var xx = cps_exec(s, k, a, oed_models[0], oed_expts[0]);
        //return xx;
        return k(s, cps_map(function(m, mi, ms, kk) {
                                console.log("kk", kk);
                                var zz = m(s, kk, a, oed_expts[0])();
                                console.log("zz", zz);
                                return zz;},
                            base_cont, 
                            oed_models));

        //return cps_exec(s, k, a, oed_models[0], oed_expts[0]);
        /*
        var collect = [];
        //var empty = function() {return [];};
        //return cpsForEach(function(m, mi, ms, nextk){
        var yy = cpsForEach(function(m, mi, ms, nextk){
                       var collectK = function(s, v) {
                           console.log("v: ", v);
                           collect.push(v);
                           console.log("collect: ", collect);
                           nextk();
                       }

                       console.log("m: ", m);
                       //var xx = untrampoline(m(s, collectK, a, oed_expts[0]));
                       var xx = m(s, collectK, a, oed_expts[0]);
                       console.log("xx: ", xx);
                       //xx()
                       //m(s, collectK, a, oed_expts[0]); nextk();}, 
                       //nextk();}, 
                       },
                   function(){return collect;}, oed_models);
        console.log("here", collect.map(untrampoline));
        return k(s, yy);
        */
        //return k(s, function(){return collect;});
        //return cps_exec(s, k, a, oed_models[0], oed_expts[0]);
 //   }

    //return oed_params.models[0](s, k, a, oed_params.experiments[0]);

    /*
    if (oed_params.models_prior == undefined)
        for (var i = 0; i < oed_params.model.length; i++)
            oed_params.prior[i] = 1/oed_params.model.length;

    if (oed_params.num_participants == undefined) 
        oed_params.num_participants = [1];

    if (oed_params.num_participants.length == 1)
    {
        console.log(oed_params.experiments)
        for (var i = 0; i < oed_params.experiments.length; i++)
        {
            var erp_list = [];
            console.log(oed_params.experiments[i])
            for (var m = 0; m < oed_params.models.length; m++)
            {
                console.log(oed_params.models[m])
                var model = oed_params.models[m];
                console.log("model: ", model);
                console.log("expt: ", oed_params.experiments[i]);
                var erp = model(s, k, a, oed_params.experiments[i]);
                console.log("done: ", erp);
                erp_list[m] = erp;
                console.log(erp_list[m])
            }
            console.log(erp_list)
                
            data.push(new print.datum(oed_params.experiments[i],
                                      get_expected_kl(erp_list, oed_params.models_prior),
                                      oed_params.num_participants[0], 
                                      erp_list));
        }
    }
    else
    {
        for (var i = 0; i < oed_params.experiments.length; i++)
        {
            for (var j = 0; j < oed_params.num_participants.length; j++)
            {
                data.push(new print.datum(oed_params.experiments[i],
                                          get_expected_kl_participants_sample(oed_params.models, 
                                                                              oed_params.models_prior,
                                                                              oed_params.num_participants[j],
                                                                              oed_params.num_participants_samples),
                                          oed_params.num_participants[j], 
                                          oed_params.models));
            }
        }
    }
    */
/*
    return data;
};
*/

var test = function(s, k, a, x, y) {
    var xx = x(s, k, a, y);
    return xx;
};

// Export

//console.log("test")

module.exports = 
{
    erp_to_pmf : erp_to_pmf,
    homogenize_pmf_list : homogenize_pmf_list,
    get_expected_kl : get_expected_kl,
    get_expected_kl_participants_sample: get_expected_kl_participants_sample,
    list_product: comb.list_product, 
    list_permutations: comb.list_permutations, 
    find_nearest: find_nearest, 
    format: print.format,
    log: print.log,
    make_data: print.make_data,
    make_datum: print.make_datum,
    data: print.data,
    test: test,
    //compute : compute
};

//global.OED = compute;



},{"./comb.js":1,"./pmf.js":4,"./print.js":5}],3:[function(require,module,exports){
(function (global){
global.oed = require('./oed.js');
//global.OED = global.oed.compute;


}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./oed.js":2}],4:[function(require,module,exports){
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


},{}],5:[function(require,module,exports){
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


},{}]},{},[3]);
