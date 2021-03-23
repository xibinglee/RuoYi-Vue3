/*
 * @Description: 权限
 * @Author: ZY
 * @Date: 2020-12-28 09:12:46
 * @LastEditors: WJM
 * @LastEditTime: 2021-03-23 15:46:33
 */

import NProgress from 'nprogress'
import 'nprogress/nprogress.css'
// import { useI18n } from 'vue-i18n'
import router from '@/router'
import { RouteLocationNormalized } from 'vue-router'
import { useStore } from './store'
import { UserActionTypes } from './store/modules/user/action-types'
import { PermissionActionType } from './store/modules/permission/action-types'
import { ElMessage } from 'element-plus'
import { userInfoRequest } from '@/apis/system/user'
// import whiteList from './config/default/whitelist'
// import { doLogin } from '@/apis/system/user'
// import settings from '@/config/default/setting.config'
NProgress.configure({ showSpinner: false })

// const getPageTitle = (key: string) => {
//   const i18n = useI18n()
//   const title = settings.title
//   const hasKey = i18n.te(`route.${key}`)
//   if (hasKey) {
//     const pageName = i18n.t(`route.${key}`)
//     return `${pageName} - ${title}`
//   }
//   return `${title}`
// }

router.beforeEach(async(to: RouteLocationNormalized, _: RouteLocationNormalized, next: any) => {
  // Start progress bar
  NProgress.start()
  const store = useStore()
  userInfoRequest().then(async(res) => {
    console.log('res', res)
    const htmlReg = /<[^>]+>/g
    if (htmlReg.test(String(res))) {
      const oppcUrl = process.env.VUE_APP_BASE_API + '/boss.system/cas/doLogin?targetUrl=' + window.document.location.origin
      console.log(oppcUrl)
      // window.location.href = oppcUrl
    } else if (res?.code === 200) {
      if (store.state.user.roles.length === 0) {
        try {
          // Note: roles must be a object array! such as: ['admin'] or ['developer', 'editor']
          await store.dispatch(UserActionTypes.ACTION_GET_USER_INFO, undefined)
          // const roles = store.state.user.roles
          // Generate accessible routes map based on role
          const accessRoutes = await store.dispatch(PermissionActionType.ACTION_SET_ROUTES, undefined)
          // Dynamically add accessible routes
          console.log(accessRoutes)
          accessRoutes.forEach((route) => {
            console.log(route, '==================================')
            router.addRoute(route)
          })
          // Hack: ensure addRoutes is complete
          // Set the replace: true, so the navigation will not leave a history record
          next({ ...to, replace: true })
        } catch (err) {
          console.log(err)
          // Remove token and redirect to login page
          store.dispatch(UserActionTypes.ACTION_RESET_TOKEN, undefined)
          ElMessage.error(err || 'Has Error')
          next(`/login?redirect=${to.path}`)
          NProgress.done()
        }
      } else {
        next()
      }
    }
    // if(res.code === 0){
    // }
  })
  // Check whether the user has obtained his permission roles
  NProgress.done()
})

router.afterEach(() => {
  // Finish progress bar
  // hack: https://github.com/PanJiaChen/vue-element-admin/pull/2939
  NProgress.done()

  // set page title
  // document.title = getPageTitle(to.meta.title)
})
