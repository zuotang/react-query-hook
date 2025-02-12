import { useState, useEffect } from "react";

function handleOption(opt) {
  let newList = [];
  function work(opt) {
    if (Array.isArray(opt)) {
      opt.forEach(work);
    } else if (opt instanceof Object) {
      Object.values(opt).forEach(work);
    } else {
      newList.push(opt);
    }
  }
  work(opt);
  return newList;
}


/*
useAutoQuery关键字  onError, onSuccess, updateQuery, mandatory, hold,defaultData, title,
useQuery关键字 onError, onSuccess, updateQuery, mandatory,defaultData, title,
useBaseFetch关键字 onError, onSuccess, updateQuery, mandatory, defaultData, title
*/
function getQueryKey(params){
  let {onError, onSuccess, updateQuery, mandatory, defaultData, title,...other}=params;
  return JSON.stringify(other);
}

// function mapToJson(map){
//   let json = {};
// 	for(let [k,v] of map){
// 		json[k]=v;
//   }
//   return JSON.stringify(json)
// }


// function jsonToMap(json){
//   let jsonObj=JSON.parse(json)
//   let map = new Map();
// 	for(let i in jsonObj){
// 		map.set(i,jsonObj[i]);
// 	}
//   return map
// }

//缓存处理
export const cacheCtx = {
  _map: new Map(),//jsonToMap(localStorage.getItem('query')) || 
  getCache(ql, params) {
    //缓存处理
    let cacheKey =  getQueryKey(params)
    if (this._map.has(ql.name)) {
      let cacheList = this._map.get(ql.name);
      if (cacheList[cacheKey]) {
        return cacheList[cacheKey];
      } else {
        //console.log("未获取到", cacheList, cacheKey);
      }
    }
  },
  setCache(ql, params, res) {
    let cacheKey =  getQueryKey(params);
    let cacheList = this._map.get(ql.name);
    if (cacheList) {
      cacheList[cacheKey] = res;
    } else {
      this._map.set(ql.name, { [cacheKey]: res });
    }
    //localStorage.setItem('query',mapToJson(this._map));
  },
  clearCache(ql){
    if(ql){
      this._map.set(ql.name,{});
    }else{
      this._map=new Map()
    }
  }
};
//isDefaultLoading 默认是否处于加载状态
function useBaseFetch(ql,defaultParams={}, defaultData = null,isDefaultLoading=false) {
  //初始数据
  let [data, setData] = useState(defaultData || {});
  let [loading, setLoading] = useState(defaultData ? false : isDefaultLoading);
  let [error, setError] = useState(null);
  let isDestroy=false;
  useEffect(()=>{
    isDestroy=false;
    return()=>{
      isDestroy=true;
    }
  },[])
  async function fetch(fetchParams={}) {
    //mandatory是否强制更新
    let {onError, onSuccess, updateQuery, mandatory, defaultData, title,...params }=Object.assign({mandatory :true, title :"请求"},defaultParams,fetchParams)
    //判断cache是否存在数据
    let res;
    let cacheObj= cacheCtx.getCache(ql, params);
    if(!mandatory && cacheObj && cacheObj.status=="fetched"){
      res=cacheObj.data
    }
    
    setError(null);
    //如果没有cache则取请求
    if (!res) {
      // 初始数据
      setLoading(true);
      //如果正在请求则等待
      if(cacheObj && cacheObj.status=="fetching"){
        res=await cacheObj.query;
        console.log('等待请求完成')
      }else{
        let queryPromise=ql(params).catch(function (error) {
          setLoading(false); 
          let message=error.response?.data?.message ||  error.message
          setError(message);
          onError && onError({ type: "error", message:message });
          return
          //throw error;
        });
        //存储cache promise
        cacheCtx.setCache(ql, params, {status:'fetching',query:queryPromise,data:null});
        res = await queryPromise;
      }
      cacheCtx.setCache(ql, params, {status:'fetched',query:null,data:res});
      if(!res){return}
      //如果组件被删除
      if(isDestroy){return}
      onSuccess && onSuccess({ type: "success", message: `${title}成功` }, res);
      setLoading(false);
    }
    if (updateQuery) {
      res = updateQuery(data, res, params);
    }
    setData(res);
    return res;
  }
  //更新缓存数据
  function updateCache(fun) {
    setData(fun(data));
  }
  
  function destroy(){
    isDestroy=true
  }
  return { fetch, data, loading, error,destroy, setError, updateCache };
}
export function useQuery(ql,defaultOption) {
  let context=useBaseFetch(ql,defaultOption);
  return {
    ...context,
    update: () => {
      console.log('重试')
      cacheCtx.clearCache(ql);
      context.fetch({mandatory:true});
    },
  }
}



//初始带入数据
export function useAutoQuery(ql,  fetchParams= {}) {
  //hold是用于等待带加载效果,stop为停止没加载效果
  let { hold,stop, ...params }=fetchParams;
  let {defaultData,mandatory=true}=params;
  let isDefault = false;
  let cacheData = !mandatory ? cacheCtx.getCache(ql, params) : undefined;
  let fetchDefaultData=defaultData || (cacheData && cacheData.data);
  //!stop为非停止状态则需要默认加载
  let context = useBaseFetch(ql,params,fetchDefaultData,!stop);
  //初次需要判断是否存在 defaultData
  useEffect(() => {
    //是否等待
    if (!hold && !defaultData && !stop) {
      isDefault = true;
      context.fetch({  mandatory });
    }
    return ()=>{
      context.destroy();
    }
  }, []);
  //状态改变时
  useEffect(() => {
    //是否等待
    if (!hold && !isDefault && !stop) {
      context.fetch({  mandatory });
    }
  }, [...handleOption(params),hold,stop]);
  return {
    ...context,
    fetchMore: (newParams, updateQuery) => {
      context.fetch(Object.assign({}, params, newParams,{updateQuery}));
    },
    update: () => {
      cacheCtx.clearCache(ql);
      context.fetch({mandatory:true});
    },
  };
}
