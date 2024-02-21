import { BasePagingDto } from '../types/base.type';

export const getDefaultPaginationReponse = (
  pagination: Partial<BasePagingDto>,
  count: number,
) => {
  const { page, size } = pagination;

  return {
    page,
    size,
    totalPages: Math.ceil(count / size) || 0,
    totalElement: count,
  };
};
