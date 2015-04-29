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

