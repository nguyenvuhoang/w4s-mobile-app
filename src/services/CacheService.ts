// import {
//   checkDatabaseAndTable,
//   CodeList,
//   getCodeListByGroupNameId,
//   getMenuByParentId,
//   getParaServerByCode,
//   insertCodeList,
//   insertParaServer,
//   insertUserCommand,
//   truncateCodeList,
//   truncateParaServer,
//   truncateUserCommand,
// } from './DatabaseService';

export const CacheService = () => {
//   const processCacheData = async <T>(
//     truncateFunc: () => Promise<void>,
//     insertFunc: (data: T[]) => Promise<void>,
//     getData: () => T[] | undefined,
//     keyName: string
//   ): Promise<void> => {
//     try {
//       await truncateFunc();
//       const data = getData() || [];
//       if (data.length < 1) {
//         console.log(`No data found for key: ${keyName}`);
//       }
//       await insertFunc(data);
//     } catch (error) {
//       console.error(`Error while processing ${keyName}:`, error);
//       throw new Error(
//         `Failed to process ${keyName}: ${
//           error instanceof Error ? error.message : error
//         }`
//       );
//     }
//   };

//   const reloadCache = async (): Promise<[boolean, string]> => {
//     try {
//       // Show loading indicator
//       if (typeof window !== 'undefined') {
//         (window as any).showLoading?.();
//       }
//       if (typeof global !== 'undefined') {
//         (global as any).showLoading?.();
//       }

//       // Call API through repository
//       const response = await systemRepository.executeReloadCache();

//       if (response.isSuccess()) {
//         const getData = <T>(key: string): T[] | undefined =>
//           response.getValue<T[]>(key);

//         try {
//           // Xử lý cacheCodeList
//           try {
//             await processCacheData(
//               truncateCodeList,
//               insertCodeList,
//               () => getData<CodeList>(StorageKey.cacheCodeList),
//               'cacheCodeList'
//             );
//           } catch (error) {
//             console.error('Lỗi trong quá trình xử lý cacheCodeList:', error);
//           }

//           // Xử lý cacheUserCommand
//           try {
//             await processCacheData(
//               truncateUserCommand,
//               insertUserCommand,
//               () => getData<UserCommand>(StorageKey.cacheUserCommand),
//               'cacheUserCommand'
//             );
//           } catch (error) {
//             console.error('Lỗi trong quá trình xử lý cacheUserCommand:', error);
//           }

//           // Xử lý cacheParaServer
//           try {
//             await processCacheData(
//               truncateParaServer,
//               insertParaServer,
//               () => getData<ParaServer>(StorageKey.cacheParaServer),
//               'cacheParaServer'
//             );
//           } catch (error) {
//             console.error('Lỗi trong quá trình xử lý cacheParaServer:', error);
//           }

//           // Xử lý ListF8Transaction
//           try {
//             const ListTransactionF8 = getData<any>(StorageKey.ListF8Transaction);
//             console.log('LIST F8', ListTransactionF8);
//             if (ListTransactionF8) {
//               await StorageService.setItem(
//                 StorageKey.ListF8Transaction,
//                 JSON.stringify(ListTransactionF8)
//               );
//             }
//           } catch (error) {
//             console.error(
//               'Lỗi trong quá trình xử lý ListF8Transaction:',
//               error
//             );
//           }
//         } catch (error) {
//           // Log lỗi tổng cho phần xử lý cache
//           console.error('Cache processing error:', error);
//           return [
//             false,
//             error instanceof Error ? error.message : 'Cache processing failed',
//           ];
//         }

//         return [true, ''];
//       } else {
//         return [false, response.getError()];
//       }
//     } catch (error: any) {
//       if (error instanceof Error) {
//         return [false, error.message];
//       } else {
//         return [false, 'An unknown error occurred'];
//       }
//     } finally {
//       // Hide loading indicator
//       if (typeof window !== 'undefined') {
//         (window as any).hideLoading?.();
//       }
//       if (typeof global !== 'undefined') {
//         (global as any).hideLoading?.();
//       }
//     }
//   };

//   const initializeDatabaseIfNeeded = async () => {
//     console.log('initializeDatabaseIfNeeded');
//     const isReady = await checkDatabaseAndTable();
//     if (!isReady) {
//       await reloadCache();
//     }
//   };

  return {
    // reloadCache,
    // initializeDatabaseIfNeeded,
    // getCodeListByGroupNameId,
    // getMenuByParentId,
    // getParaServerByCode,
  };
};