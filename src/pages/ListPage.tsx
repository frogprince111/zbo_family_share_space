import { PageContainer } from '../components/PageContainer'

const lists = [
  { title: '购物清单', items: ['牛奶', '水果', '纸巾'] },
  { title: '家务清单', items: ['扫地', '洗衣服', '整理餐桌'] },
  { title: '出行清单', items: ['证件', '充电器', '常用药'] },
]

export default function ListPage() {
  return (
    <PageContainer>
      <h1 className="text-3xl font-black text-family-text">家庭清单</h1>
      <div className="mt-7 grid gap-5 md:grid-cols-3">
        {lists.map((list) => (
          <section key={list.title} className="rounded-[24px] border border-family-border bg-white p-6 shadow-soft">
            <h2 className="text-xl font-bold text-family-text">{list.title}</h2>
            <ul className="mt-5 space-y-3 text-family-muted">
              {list.items.map((item) => (
                <li key={item} className="rounded-2xl bg-slate-50 px-4 py-3">
                  {item}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </PageContainer>
  )
}
