/**
 * 使用 React 19 useOptimistic Hook 的職缺申請元件範例
 * 展示如何在等待伺服器回應時提供即時 UI 回饋
 */

import { useState, useOptimistic } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Check } from 'lucide-react';

/**
 * 職缺申請卡片元件（使用樂觀更新）
 * 
 * @param {Object} props
 * @param {Object} props.job - 職缺資訊
 * @param {Function} props.onApply - 申請職缺的 API 函式
 */
export function OptimisticJobApplication({ job, onApply }) {
  const [currentJob, setCurrentJob] = useState(job);
  
  // 使用 useOptimistic 實現樂觀 UI 更新
  const [optimisticJob, setOptimisticJob] = useOptimistic(
    currentJob,
    (state, newState) => ({ ...state, ...newState })
  );

  const handleApply = async (formData) => {
    try {
      // 立即更新 UI（樂觀更新）
      setOptimisticJob({
        applied: true,
        applicationStatus: 'pending',
      });

      // 實際的 API 呼叫
      const result = await onApply(job.id, formData);
      
      // 更新為伺服器回傳的實際狀態
      setCurrentJob(prevJob => ({
        ...prevJob,
        applied: true,
        applicationStatus: result.status,
        applicationId: result.id,
      }));
    } catch (error) {
      console.error('申請失敗:', error);
      // React 會自動回滾到 currentJob 的狀態
    }
  };

  const isProcessing = optimisticJob.applied && !currentJob.applied;

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle>{job.title}</CardTitle>
            <CardDescription>{job.company}</CardDescription>
          </div>
          {optimisticJob.applied && (
            <Badge variant={isProcessing ? "secondary" : "success"}>
              {isProcessing ? (
                <span className="flex items-center gap-1">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  處理中
                </span>
              ) : (
                <span className="flex items-center gap-1">
                  <Check className="h-3 w-3" />
                  已申請
                </span>
              )}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="text-sm text-muted-foreground">
            <p className="line-clamp-3">{job.description}</p>
          </div>
          
          <form
            action={async (formData) => {
              await handleApply(formData);
            }}
            className="space-y-2"
          >
            <Button
              type="submit"
              className="w-full"
              disabled={optimisticJob.applied}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  申請中...
                </>
              ) : optimisticJob.applied ? (
                '已完成申請'
              ) : (
                '立即申請'
              )}
            </Button>
          </form>

          {optimisticJob.applicationStatus && (
            <div className="text-xs text-center text-muted-foreground">
              狀態: {optimisticJob.applicationStatus === 'pending' ? '審核中' : '已處理'}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * 使用範例：
 * 
 * import { OptimisticJobApplication } from '@/components/OptimisticJobApplication';
 * import { applyToJob } from '@/services/api';
 * 
 * function JobDetailPage({ job }) {
 *   return (
 *     <div>
 *       <h1>職缺詳情</h1>
 *       <OptimisticJobApplication 
 *         job={job} 
 *         onApply={applyToJob}
 *       />
 *     </div>
 *   );
 * }
 */

