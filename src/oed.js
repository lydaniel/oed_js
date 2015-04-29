'use strict';

var pmf = require('./pmf.js');
var comb = require('./comb.js');

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

var print = function(inputs, kl, sort) 
{
    var list = [];
    for (var i = 0; i < inputs.length; i++)
        list.push({input: inputs[i], output: kl[i]});

    if (sort == true)
        list.sort(function(x,y){return y.output - x.output;});

    return list;
};

// Export

module.exports = 
{
    erp_to_pmf : erp_to_pmf,
    homogenize_pmf_list : homogenize_pmf_list,
    get_expected_kl : get_expected_kl,
    get_expected_kl_participants_sample: get_expected_kl_participants_sample,
    list_product: comb.list_product, 
    list_permutations: comb.list_permutations, 
    find_nearest: find_nearest, 
    print: print
};


